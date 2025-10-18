import { PrismaClient, Question, QuestionType ,Prisma } from "../generated/prisma";
import { IQuizRepository } from "../IReps/IQuizRepo";
import { CreateQuizInput } from "../entities/Quiz";
import { v4 as uuid  } from "uuid";
import { Prisma_Role ,AttemptStatus} from "../generated/prisma";
import { start } from "repl";
import { CourseDTO } from "../IReps/IUserRepo";
import { ResourceItemInput } from "../IReps/IQuizRepo";
const prisma = new PrismaClient();

export class PrismaQuizRepo implements IQuizRepository {

  private arraysEqual(a: number[], b: number[]) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    return a.length === b.length && a.every(v => b.includes(v));
  }

  private mapQuestionType(type: string): QuestionType {
    switch (type) {
      case "Single Correct":
        return QuestionType.SingleChoice;
      case "Multi Correct":
      case "Multiple Correct":
        return QuestionType.MultipleChoice;
      default:
        throw new Error(`Unknown question type: ${type}`);
    } 
  }

  async createQuiz(data: CreateQuizInput): Promise<string> {
    try{
    return await prisma.$transaction(async (tx) => {
      const quizId = uuid();
      if (!data.Questions.length) throw new Error("Quiz must have at least one question.");
     const user = await tx.user.findUnique({
  where: { id: data.creatorId },
  select: { role: true, creatorVerified: true },
});
if(user?.role !== Prisma_Role.Creator) {
  throw new Error("User is not a creator");
}

      // Create or connect course if courseId is given
      let courseId = data.courseId ?? null;
      if (!courseId && data.courseURL) {
        const course = await tx.course.upsert({
          where: { url: data.courseURL },
          update: {},
          create: { id: uuid(), name: data.title, url: data.courseURL },
        });
        courseId = course.id;
      }
   

      // Create Quiz
      await tx.quiz.create({
        data: {
          id: quizId,
          title: data.title,
          description: data.description,
          duration: data.duration,
          difficulty: data.difficulty, 
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          courseId,
          thumbnailURL: data.thumbURL ?? "",
          price: data.price,
          backtrack: data.backtrack,
          randomize: data.randomize,
          currency: data.currency ?? "inr",
          verified: user?.creatorVerified ?? false,
        },
      });

      // Add Tags
      if (data.Tags && data.Tags.length) {
     // 1️⃣ Upsert all tags in parallel, collect tag IDs
const tagRecords = await Promise.all(
  data.Tags.map(tag =>
    tx.tag.upsert({
      where: { name: tag },
      update: {},
      create: { id: uuid(), name: tag },
      select: { id: true }, // ✅ ensures tag.id is available
    })
  )
);


// 2️⃣ Bulk insert quizTag
await tx.quizTag.createMany({
  data: tagRecords.map(tag => ({
    quizId: quizId,
    tagId: tag.id,
  })),
  skipDuplicates: true,  // avoids error if the link already exists
});


      }

      // console.log(data.Questions)
    // Add Questions
await tx.question.createMany({
  data: data.Questions.map((question) => ({
    id: uuid(),
    quizId,
    type: this.mapQuestionType(question.type),
    text: question.text,
    points: question.points,
    negPoints: question.negPoints ?? 0,
    options: question.options,
    correctAnswers: question.correctAnswers,
    answerText: question.answerText,
    attachFileType: question.attachFileType,
    attachFileURL: question.attachFileURL,
  })),
});


      return quizId;
    },{maxWait: 10000, timeout: 45000});
  }
  catch (error) {
    console.error("Error creating quiz:", error);
    throw error;
  }
  }

async findById(id: string): Promise<any> {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      course: { select: { id: true, name: true, url: true } },
      quizTags: { include: { tag: { select: { name: true } } } },
    },
  });

  if (!quiz) return null;

  const [
    questionStats,
    attemptStats,
    ratingStats,
    certificateCount,
    completedAttempts,
    questionTypes,
    questionsWithAttachments
  ] = await Promise.all([
    prisma.question.aggregate({
      where: { quizId: id },
      _count: { id: true },
      _sum: { points: true, negPoints: true },
      _avg: { points: true },
    }),
    prisma.quizAttempt.aggregate({
      where: { quizId: id },
      _count: { id: true },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
    }),
    prisma.quizRating.aggregate({
      where: { quizId: id },
      _count: { id: true },
      _avg: { rating: true },
    }),
    prisma.certificate.count({
      where: { quizId: id },
    }),
    prisma.quizAttempt.count({
      where: { quizId: id, finishedAt: { not: null }, score: { not: null } }
    }),
    prisma.question.groupBy({
      by: ['type'],
      where: { quizId: id },
      _count: { type: true },
    }),
    prisma.question.count({
      where: { quizId: id, attachFileURL: { not: null } }
    })
  ]);

  const totalQuestions = questionStats._count.id || 0;
  const totalPoints = questionStats._sum.points || 0;
  const totalNegPoints = questionStats._sum.negPoints || 0;
  const avgPoints = questionStats._avg.points || 0;

  const totalAttempts = attemptStats._count.id || 0;
  const avgScore = attemptStats._avg.score || 0;
  const maxScore = attemptStats._max.score || 0;
  const minScore = attemptStats._min.score || 0;

  const avgScorePercentage = totalPoints > 0 ? (avgScore / totalPoints) * 100 : 0;
  const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
  const passRate = completedAttempts > 0 && avgScorePercentage >= 60 ? avgScorePercentage : 0;

  const avgRating = ratingStats._avg.rating || 0;
  const totalRatings = ratingStats._count.id || 0;

  const difficultyActual = avgScorePercentage > 0
    ? avgScorePercentage < 50 ? 'Hard'
    : avgScorePercentage < 70 ? 'Medium'
    : 'Easy'
    : quiz.difficulty;

  const estimatedTime = Math.max(quiz.duration, totalQuestions * 2);
  const certificateEligibilityRate = totalAttempts > 0
    ? Math.round((certificateCount / totalAttempts) * 100 * 100) / 100
    : 0;

  const questionTypeDistribution = questionTypes.reduce((acc, qt) => {
    acc[qt.type] = qt._count.type;
    return acc;
  }, {} as Record<string, number>);
  const top5Comments = await prisma.review.findMany({
    where: { quizId: id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      userId: true,
      text: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true } }
    }
  });
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    duration: quiz.duration,
    difficulty: quiz.difficulty,
    creator: quiz.creator,
    course: quiz.course,
    tags: quiz.quizTags.map(qt => qt.tag.name),
    price: quiz.price,
    currency: quiz.currency,
    backtrack: quiz.backtrack,
    randomize: quiz.randomize,
    thumbnailURL: quiz.thumbnailURL,
    createdAt: quiz.createdAt,
    avgRating,
    visibleToPublic: quiz.visibleToPublic,

    analytics: {
      questions: {
        totalQuestions,
        questionTypes: questionTypeDistribution,
        totalPoints,
        totalNegPoints,
        averagePointsPerQuestion: avgPoints,
        questionsWithAttachments,
      },
      attempts: {
        totalAttempts,
        completedAttempts,
        inProgressAttempts: totalAttempts - completedAttempts,
        averageScore: Number(avgScore.toFixed(2)),
        averageScorePercentage: Number(avgScorePercentage.toFixed(2)),
        highestScore: maxScore,
        lowestScore: minScore,
        completionRate: Number(completionRate.toFixed(2)),
      },
      ratings: {
        totalRatings,
        averageRating: avgRating,
      },
      certificates: {
        totalCertificatesIssued: certificateCount,
        certificateEligibilityRate,
      },
      engagement: {
        popularityScore: totalAttempts,
        difficultyActual,
        estimatedTimeToComplete: estimatedTime,
        passRate: Number(passRate.toFixed(2)),
      },
      comments: {
        top5Comments: top5Comments.map(comment => ({
          id: comment.id,
          userId: comment.userId,
          text: comment.text,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          userName: comment.user.name,
        })),
      },
    },

    summary: {
      totalQuestions,
      totalPoints,
      totalAttempts,
      completedAttempts,
      averageScore: Number(avgScorePercentage.toFixed(2)),
      completionRate: Number(completionRate.toFixed(2)),
      averageRating:avgRating,
      totalRatings,
      certificatesIssued: certificateCount,
      difficulty: difficultyActual,
      estimatedDuration: `${estimatedTime} minutes`,
    }
  };
}

async findByIdPaid(quizId: string, userId: string): Promise<any> {
  // Check if user has already started this quiz
  let attempt = await prisma.quizAttempt.findFirst({
    where: {
      userId,
      quizId,
    },
  });
  // If attempt exists, check if it's finished  
  console.log("Attempt found:", attempt);

  if (!attempt) {
    throw new Error("Access denied");
  }
  
  await prisma.quizAttempt.updateMany({
    where: { finishedAt: null, userId, quizId },
    data: { finishedAt: new Date() ,status:AttemptStatus.ABANDONED}, 
  });
  const previousAttemptsCount = await prisma.quizAttempt.count({  
    where: {
      userId,
      quizId,
    },
  });
  attempt = await prisma.quizAttempt.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      quizId,
      status:AttemptStatus.STARTED,
      attemptNumber:previousAttemptsCount+1 ,
      startedAt: new Date(),
      score: 0,
      totalScore: 0, // Initialize totalScore
      finishedAt: null, // Leave it null for now
    },
  });

  // Fetch questions with correct type mapping for frontend
  const questions = await prisma.question.findMany({
    where: { quizId },
    select: {
      id: true,
      text: true,
      options: true,
      type: true,
      points: true,
      negPoints: true,
      attachFileURL: true,
      attachFileType: true,
    },
  });

  // Map database enum to frontend string
  const mappedQuestions = questions.map(q => ({
    ...q,
    type: q.type === QuestionType.SingleChoice ? 'Single Correct' : 'Multi Correct'
  }));

  // Fetch quiz metadata
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      duration: true, // in minutes, assuming you have this
      backtrack: true,
      randomize: true,

    },
  });
  // console.log(quiz)

  return {
    quizId,
    title: quiz?.title || '',
    timeLimit: quiz?.duration || 60,
    startedAt: new Date(), // use this as reliable timer start point
    bactrack: quiz?.backtrack ,
    randomize: quiz?.randomize ,
    questions: mappedQuestions,
  };
}
async findByKeyAndValue(key: string, value: string): Promise<any[]> {
  let quizzes;

  if (key === 'tag') {
    // Special handling for tag search via quizTags relation
    quizzes = await prisma.quiz.findMany({
      where: {
        visibleToPublic: true,
        quizTags: {
          some: {
            tag: {
              name: {
                equals: value,
              },
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailURL: true,
        price: true,
        duration: true,
        verified: true,
        creatorName: true,
        quizTags: {
          select: {
            tag: { select: { name: true } },
          },
        },
      },
    });
  } else {
    // Default key-value filtering for scalar fields
    quizzes = await prisma.quiz.findMany({
      where: {
        visibleToPublic: true,
        [key]: {
          contains: value        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailURL: true,
        price: true,
        duration: true,
        verified: true,
        creatorName: true,
        quizTags: {
          select: {
            tag: { select: { name: true } },
          },
        },
      },
    });
  }

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    thumbnailURL: quiz.thumbnailURL,
    price: quiz.price,
    duration: quiz.duration,
    verified: quiz.verified,
    creatorName: quiz.creatorName,
    quizTags: quiz.quizTags.map((qt) => qt.tag.name),
  }));
}

async submitAttempt(data: {
    userId: string;
    quizId: string;
    answers: {
      questionId: string;
      selectedOptions?: number[];
      answerText?: string;
    }[];
    startedAt: Date | string | number;
    finishedAt?: Date | string | number;
  }): Promise<any> {
    const startedAt = new Date(data.startedAt);
    const finishedAt = data.finishedAt ? new Date(data.finishedAt) : new Date();

    return await prisma.$transaction(async (tx) => {
      // 1) Fetch in-progress attempt
      const inProgress = await tx.quizAttempt.findFirst({
        where: { userId: data.userId, quizId: data.quizId, status: AttemptStatus.STARTED },
      });
      if (!inProgress) {
        throw new Error("No active attempt found or it's already completed.");
      }

      // 2) Enforce duration
      const quiz = await tx.quiz.findUnique({
        where: { id: data.quizId },
        select: { duration: true },
      });
      if (!quiz) throw new Error('Quiz not found');
      const elapsedMs = finishedAt.getTime() - startedAt.getTime();
      const allowedMs = quiz.duration * 60_000;
      if (elapsedMs > allowedMs) {
        await tx.quizAttempt.update({
          where: { id: inProgress.id },
          data: { status: AttemptStatus.TIMED_OUT, finishedAt },
        });
        throw new Error('Time limit exceeded; attempt marked TIMED_OUT');
      }

      // 3) Abandon other attempts
      await tx.quizAttempt.updateMany({
        where: {
          userId: data.userId,
          quizId: data.quizId,
          status: AttemptStatus.STARTED,
          NOT: { id: inProgress.id },
        },
        data: { status: AttemptStatus.ABANDONED, finishedAt },
      });

      // 4) Score calculation
      const questions = await tx.question.findMany({ where: { quizId: data.quizId } });
      let score = 0;
      let totalScore = 0;
      const answerMap = new Map(data.answers.map(a => [a.questionId, a]));
      const answersToInsert: Prisma.AttemptAnswerCreateManyInput[] = [];

      for (const q of questions) {
        totalScore += q.points;
        const ua = answerMap.get(q.id);
        let selected: any = [];
        let correct = false;

        if (ua) {
          if (  q.type === QuestionType.SingleChoice ||
        q.type === QuestionType.MultipleChoice) {
            const correctArr = q.correctAnswers as number[];
            const sel = ua.selectedOptions || [];
            selected = sel;
            correct = this.arraysEqual(correctArr.slice().sort(), sel.slice().sort());
            score += correct ? q.points : -(sel.length ? q.negPoints : 0);
          } else {
            // Subjective or File
            selected = ua.answerText || '';
          }
        }

        answersToInsert.push({
          id: crypto.randomUUID(),
          attemptId: inProgress.id,
          questionId: q.id,
          selected,
          correct,
        });
      }

      // 5) Finalize this attempt
      const updatedAttempt = await tx.quizAttempt.update({
        where: { id: inProgress.id },
        data: {
          score,
          totalScore,
          finishedAt,
          status: AttemptStatus.COMPLETED,
        },
      });

      // 6) Bulk insert answers
      await tx.attemptAnswer.createMany({ data: answersToInsert });

      // 7) Certificate issuance
      const countAttempts = await tx.quizAttempt.count({ where: { userId: data.userId, quizId: data.quizId } });
      const hasAccessed = await tx.quizAttempt.findFirst({
  where: {
    userId: data.userId,
    quizId: data.quizId,
    analysisAccessed: true,
  },
  select: { id: true },
});
 if (!hasAccessed) {
  // Upsert-style: create if none exists, otherwise update
  const certData = {
    userId: data.userId,
    quizId: data.quizId,
    score,
    totalScore,
    count: countAttempts,
    
  };

  await tx.certificate.upsert({
    where: {
      userId_quizId: {
        userId: data.userId,
        quizId: data.quizId,
      },
    },
    create: {
      id: crypto.randomUUID(),
      ...certData,
    },
    update: certData,
  });
}

      // 8) Return stats
      return this.getSubmissionStats(updatedAttempt.id, data.userId, tx);
    }, { maxWait: 10000, timeout: 30000 });
  }

  // Retrieve deep analysis & mark as accessed
  async AttemptAnalysis(quizId: string, userId: string): Promise<any> {
    // 1) Mark analysisAccessed
    await prisma.quizAttempt.updateMany({
      where: { quizId, userId, status: AttemptStatus.COMPLETED, analysisAccessed: false },
      data: { analysisAccessed: true },
    });

    // 2) Fetch attempts list
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { startedAt: 'desc' },
      select: { id: true, score: true, startedAt: true, finishedAt: true, attemptNumber: true, totalScore: true },
    });
    if (!attempts.length) throw new Error('No attempts found for analysis');

    // 3) Question type distribution
    const stats = await prisma.question.groupBy({
      by: ['type'], where: { quizId }, _count: { type: true },
    });
    const typeDist = stats.reduce((acc, cur) => ({ ...acc, [cur.type]: cur._count.type }), {});

    // 4) Detailed breakdown of latest
    const latestId = attempts[0].id;
    const detailed = await prisma.attemptAnswer.findMany({
      where: { attemptId: latestId }, include: { question: { select: { id: true, text: true, type: true, correctAnswers: true, options: true } } },
    });
    const breakdown = detailed.map(ans => ({
      questionId: ans.question.id,
      title: ans.question.text,
      type: ans.question.type,
      selectedAnswer: ans.selected,
      correctAnswer: ans.question.correctAnswers,
      isCorrect: ans.correct,
      options: ans.question.options,
    }));

    return {
      attempts,
      latestAttemptDetails: {
        attemptId: latestId,
        score: attempts[0].score,
        startedAt: attempts[0].startedAt,
        finishedAt: attempts[0].finishedAt,
        questionBreakdown: breakdown,
        totalScore: attempts[0].totalScore,
      },
      questionTypeDistribution: typeDist,
    };
  }

async editRating(quizId: string, userId: string, rating: number): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    // 1) Check if user has already rated this quiz
    const existingRating = await tx.quizRating.findFirst({
      where: { quizId, userId },
    });

    if (existingRating) {
      // Update existing rating
      return  await tx.quizRating.update({
        where: { id: existingRating.id },
        data: { rating },
      });
    } else {
      // Create new rating
      return await tx.quizRating.create({
        data: {
          id: uuid(),
          quizId,
          userId,
          rating,
        },
      });
    }

   

  }
  ,{maxWait: 10000, timeout: 30000});
}
async getSubmissionStats(
  attemptId: string,
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<any> {
  const client = tx ?? prisma;

  // 1) Validate attempt ownership and fetch core info
  const attempt = await client.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      quizId: true,
      score: true,
      totalScore: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new Error('Attempt not found or does not belong to this user.');
  }

  const { quizId, score: userScore } = attempt;

  // 2) Fetch quiz metadata
  const quiz = await client.quiz.findUnique({
    where: { id: quizId },
    select: { title: true },
  });
  if (!quiz) throw new Error('Quiz not found.');

  // 3) Aggregate peer statistics (based on all attempts)
  const agg = await client.quizAttempt.aggregate({
    where: { quizId },
    _avg: { score: true },
    _max: { score: true },
    _min: { score: true },
    _count: { id: true },
  });

  const peerStats = {
    averageScore: Number((agg._avg.score ?? 0).toFixed(1)),
    highestScore: agg._max.score ?? 0,
    lowestScore: agg._min.score ?? 0,
    totalAttempts: agg._count.id,
  };

  // 4) Group best score per user (for leaderboard and accurate ranking)
  const grouped = await client.quizAttempt.groupBy({
    by: ['userId'],
    where: { quizId },
    _max: { score: true },
  });

  // Build leaderboard: best score per user
  const leaderboard = grouped
    .map(g => ({ userId: g.userId, score: g._max.score ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // 5) Compute this user's overall rank (based on best score per user)
  const userBestScore = leaderboard.find(g => g.userId === userId)?.score ?? 0;
  const betterCount = leaderboard.filter(e => e.score > userBestScore).length;
  const userRank = betterCount + 1;

  // 6) Top 5 users
  const topEntries = leaderboard.slice(0, 5);
  const topUserIds = topEntries.map(e => e.userId);

  const users = await client.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true },
  });

  const nameMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const topAttempts = topEntries.map((e, idx) => ({
    userId: e.userId,
    userName: nameMap[e.userId] ?? 'Unknown',
    score: e.score,
    rank: idx + 1,
  }));

  // 7) Certificate info
  const cert = await client.certificate.findUnique({
    where: { userId_quizId: { userId, quizId } },
    select: { id: true },
  });

  // 8) Assemble response
  return {
    userAttempt: {
      id: attempt.id,
      quizId,
      score: attempt.score,
      userRank,
      totalScore: attempt.totalScore,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt!,
    },
    quizTitle: quiz.title,
    peerStats,
    topAttempts,
    totalUsers: leaderboard.length, // Correct total unique users
    certificateIssued: Boolean(cert),
    certificateId: cert?.id,
  };
}


async getQuizByTitle(quizTitle: string): Promise<CourseDTO[]> {
  const quizzes = await prisma.quiz.findMany({
    where: {
      title: {
        contains: quizTitle,
        // mode: 'insensitive',  
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailURL: true,
      price: true,
      duration: true,
      verified: true,
      creatorName: true,
    },
  });

  return quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    thumbnailURL: quiz.thumbnailURL,
    price: quiz.price,
    duration: quiz.duration,
    verified: quiz.verified,
    creatorName: quiz.creatorName,
  }));
}

async addComment(quizId: string, userId: string, comment: string): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    // Check if the quiz exists
    const quiz = await tx.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }
    const user = await tx.user.findUnique({
      where: { id: userId }, 
      select: { name: true }, 
    });
    // Create the comment
    return await tx.review.create({
      data: {
        id: uuid(),
        quizId,
        userId,
        text: comment,
        createdAt: new Date(),
        updatedAt : new Date(),
      },

    });

  }, { maxWait: 10000, timeout: 30000 });
}

async addResourceItemToPath(pathId: string, order: number, input: ResourceItemInput): Promise<void> {
  await prisma.learningPathItem.create({
    data: {
      id: uuid(),
      learningPathId: pathId,
      type: input.type,
      order,
      quizId: input.type === 'QUIZ' ? input.quizId : undefined,
      resourceTitle: input.type !== 'QUIZ' ? input.resourceTitle : undefined,
      resourceUrl: input.type !== 'QUIZ' ? input.resourceUrl : undefined,
    },
  });
}
async getItemsInPath(pathId: string): Promise<any[]> {
  return await prisma.learningPathItem.findMany({
    where: { learningPathId: pathId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      type: true,
      order: true,
      quizId: true,
      resourceTitle: true,
      resourceUrl: true,
    },
  });
}
async removeItemFromPath(itemId: string, pathId: string): Promise<void> {
  await prisma.learningPathItem.delete({
    where: { id: itemId },
  });
}
async updateItemOrderInPath(itemId: string, pathId: string, newOrder: number): Promise<void> {
  await prisma.learningPathItem.update({
    where: { id: itemId },
    data: { order: newOrder },
  });
}

async  getUserLearningPaths(userId: string): Promise<any[]> {
  return await prisma.learningPath.findMany({
    where: {
      users: {
        some: {
          userId, // filter through UserTestSeries table
        },
      },
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          order: true,
          quizId: true,
          resourceTitle: true,
          resourceUrl: true,
        },
      },
    },
  });
}
async createLearningPath(
  title: string,
  description?: string
  , 
  thumbnailURL?: string
): Promise<string> {
  const pathId = uuid();
  await prisma.learningPath.create({
    data: {
      id: pathId,
      title,
      description: description || '',
      thumbnailURL: thumbnailURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return pathId;
}

async getLearningPathById(pathId: string): Promise<any> {
  return await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          order: true,
          quizId: true,
          resourceTitle: true,
          resourceUrl: true,
        },
      },
    },
  });
}
async getLeaningPathByTitle(title: string): Promise<any> {
  return await prisma.learningPath.findFirst({
    where: { 
      title: {
        contains: title,
        // mode: 'insensitive',  // Uncomment if you want case-insensitive search
      },
     },
    include: {
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          order: true,
          quizId: true,
          resourceTitle: true,
          resourceUrl: true,
        },
      },
    },
  });
}

async getPathsInfiniteScroll(
  cursor?: string |null,
  take?: number
): Promise<{ paths: any[]; nextCursor: string |null }> {
  take = take || 10; // Default to 10 if not provided
  const query: Prisma.LearningPathFindManyArgs = {
    take,
    orderBy: { createdAt: 'desc' },
   
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1; // Skip the cursor item itself
  }

  const paths = await prisma.learningPath.findMany(query);

  return {
    paths,
    nextCursor: paths.length === take ? paths[paths.length - 1].id : null,
  };
}

}