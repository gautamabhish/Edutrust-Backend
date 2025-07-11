import { PrismaClient, Question, QuestionType ,Prisma } from "../generated/prisma";
import { IQuizRepository } from "../IReps/IQuizRepo";
import { CreateQuizInput } from "../entities/Quiz";
import { v4 as uuid  } from "uuid";

import { start } from "repl";
import { CourseDTO } from "../IReps/IUserRepo";

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
      const verified = await tx.user.findUnique({
        where: { id: data.creatorId },
        select: { creatorVerified: true },
      });

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
          verified: verified?.creatorVerified ?? false,
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
    throw new Error("Failed to create quiz");
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
    data: { finishedAt: new Date() }, 
  });

  attempt = await prisma.quizAttempt.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      quizId,
      startedAt: new Date(),
      score: 0,
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
  // Ensure startedAt and finishedAt are Date objects
  data.startedAt = new Date(data.startedAt);
  const finishTime = data.finishedAt
    ? new Date(data.finishedAt)
    : new Date();

  console.log('Starting submit attempt with data:', JSON.stringify(data, null, 2));

  return await prisma.$transaction(async (tx) => {
    // 1) Load all questions for this quiz once
    const owns = await tx.quizAttempt.findFirst({
      where: {
        userId: data.userId,
        quizId: data.quizId,
        finishedAt: null, // Means it's in-progress
      },
    });
    if (!owns) {
      throw new Error("You don't own this quiz or it's not in-progress.");
    }
    const questions = await tx.question.findMany({
      where: { quizId: data.quizId }
    });

    console.log('Loaded questions:', questions.map(q => ({ 
      id: q.id, 
      type: q.type, 
      correctAnswers: q.correctAnswers,
      points: q.points,
      negPoints: q.negPoints 
    })));

    let score = 0;
    let totalScore = 0 ;
// Step 1: Map answers for quick lookup
const answerMap = new Map(
  data.answers.map((a) => [a.questionId, a])
);

// Step 2: Loop over all questions, not just answers
for (const question of questions) {
  totalScore += question.points; // Always count this toward totalScore

  const userAnswer = answerMap.get(question.id);

  if (!userAnswer) {
    // User skipped this question
    console.log(`Skipped question ${question.id}`);
    continue;
  }

  if (question.type === QuestionType.SingleChoice || question.type === QuestionType.MultipleChoice) {
    const correctAnswers = question.correctAnswers as number[];
    const selectedOptions = userAnswer.selectedOptions || [];

    const isCorrect = this.arraysEqual(
      correctAnswers.slice().sort(),
      selectedOptions.slice().sort()
    );

    if (isCorrect) {
      score += question.points;
    } else {
      if (selectedOptions.length > 0) {
        score -= question.negPoints;
      }
    }
  }

  if (question.type === "Subjective" || question.type === "File") {
    console.log(`Skipping subjective/file question ${question.id}`);
    // You may skip or log for manual evaluation
  }
}


    console.log(`Final calculated score: ${score}`);
    console.log(`Total score possible: ${totalScore}`);

    // 3) Attempt to find an existing QuizAttempt session
    let attemptRecord = await tx.quizAttempt.findFirst({
      where: {
        userId: data.userId,
        quizId: data.quizId,
        finishedAt: null, // Means it's in-progress
      },
    });

    console.log('Found existing attempt:', attemptRecord?.id);

    // 4) Update or Create the QuizAttempt
    if (attemptRecord) {
      attemptRecord = await tx.quizAttempt.update({
        where: { id: attemptRecord.id },
        data: {
          score,
          finishedAt: new Date(finishTime),
        },
      });
      console.log('Updated attempt with score:', score);
    } else {
      attemptRecord = await tx.quizAttempt.create({
        data: {
          id: crypto.randomUUID(),
          userId: data.userId,
          quizId: data.quizId,
          score,
          startedAt: data.startedAt as Date,
          finishedAt: new Date(finishTime),
        },
      });
      console.log('Created new attempt with score:', score);
    }

   // 5) Count attempt number for the user
const attemptCount = await tx.quizAttempt.count({
  where: {
    userId: data.userId,
    quizId: data.quizId,
  },
});

// 6) Upsert certificate — replace old with new
let certificateId: string | undefined;
try {
  const cert = await tx.certificate.upsert({
    where: {
       userId_quizId:{ userId: data.userId,
        quizId: data.quizId,
       }
      
    },
    update: {
      score,
      count: attemptCount,
      issuedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      userId: data.userId,
      quizId: data.quizId,
      score,
      totalScore:totalScore,
      count: attemptCount,
    },
    select: { id: true },
  });
  certificateId = cert.id;
  console.log('Certificate created or updated:', certificateId);
} catch (error) {
  console.log('Certificate creation/upsert failed:', error);
}
 // 6) Return everything
    return  await this.getSubmissionStats(attemptRecord.id, data.userId,tx);
  },{maxWait: 10000, timeout: 30000});
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
  tx?: Prisma.TransactionClient  // <- optional transaction client
): Promise<any> {
  const client = tx ?? prisma; // use passed tx or fallback to global prisma

  // 1) Fetch the specific attempt by ID & ensure it belongs to this user
  const userAttemptRecord = await client.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      quizId: true,
      score: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  if (!userAttemptRecord || userAttemptRecord.userId !== userId) {
    throw new Error('Attempt not found or does not belong to this user.');
  }

  const { quizId } = userAttemptRecord;

  // 2) Fetch the quiz title
  const quizRecord = await client.quiz.findUnique({
    where: { id: quizId },
    select: { title: true },
  });

  if (!quizRecord) {
    throw new Error('Quiz not found.');
  }

  // 3) Aggregate peer statistics (all attempts for the same quiz)
  const agg = await client.quizAttempt.aggregate({
    where: { quizId },
    _avg: { score: true },
    _max: { score: true },
    _min: { score: true },
    _count: { id: true },
  });

  const averageScore = agg._avg.score ?? 0;
  const highestScore = agg._max.score ?? 0;
  const lowestScore = agg._min.score ?? 0;
  const totalAttempts = agg._count.id;

  // 4) Compute this user's rank:
  const betterCount = await client.quizAttempt.count({
    where: {
      quizId,
      score: { gt: userAttemptRecord.score ?? 0 },
    },
  });
  const rank = betterCount + 1;
// 1. Get best score for each user for this quiz
const grouped = await client.quizAttempt.groupBy({
    by: ['userId'],
    where: { quizId },
    _max: { score: true },
  });

  // 2. Sort all users by highest score descending
  const sortedUsers = grouped
    .map(g => ({
      userId: g.userId,
      score: g._max.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  // 3. Create a userId → rank map
  const userRanks: Record<string, number> = {};
  sortedUsers.forEach((entry, idx) => {
    userRanks[entry.userId] = idx + 1;
  });

  // 4. Extract top 5 users
  const top5 = sortedUsers.slice(0, 5);
  const topUserIds = top5.map(u => u.userId);

  // 5. Fetch names for top 5 users
  const userInfos = await client.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true },
  });

  const userNameMap = Object.fromEntries(userInfos.map(u => [u.id, u.name]));

  // 6. Prepare leaderboard
  const topAttempts = top5.map(u => ({
    userName: userNameMap[u.userId] ?? 'Unknown',
    score: u.score,
    rank: userRanks[u.userId],
  }));

// 7. Get rank of this specific attempt
const specificAttemptRank = 
  sortedUsers.filter(u => u.score > (userAttemptRecord.score ?? 0)).length + 1;


  // 6) Check if a certificate was issued
  const certRecord = await client.certificate.findFirst({
    where: {
      userId,
      quizId,
    },
    select: { id: true ,totalScore: true, 
     },
  });

  const certificateIssued = Boolean(certRecord);
  const certificateId = certRecord?.id;

  // 7) Assemble and return
  return {
    userAttempt: {
      id: userAttemptRecord.id,
      userId: userAttemptRecord.userId,
      quizId: userAttemptRecord.quizId,
      score: userAttemptRecord.score,
      userRank: specificAttemptRank,
      // userBestScore: userBestScore,
      startedAt: userAttemptRecord.startedAt,
      finishedAt: userAttemptRecord.finishedAt!,
      totalScore : certRecord?.totalScore
    },
    quizTitle: quizRecord.title,
    peerStats: {
      averageScore: Number(averageScore.toFixed(1)),
      highestScore,
      lowestScore,
      rank,
      totalAttempts,
    },
    topAttempts,
    certificateIssued,
    certificateId,
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
}