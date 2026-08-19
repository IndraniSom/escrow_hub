import { PrismaClient, Role, ProjectStatus, MilestoneStatus, EscrowState, DisputeState } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const client = await prisma.user.upsert({
    where: { stellarAddress: 'GCLIENT12345678901234567890123456789012345678901234' },
    update: {},
    create: {
      stellarAddress: 'GCLIENT12345678901234567890123456789012345678901234',
      role: Role.CLIENT,
      username: 'alice',
      displayName: 'Alice Johnson',
      bio: 'Freelance client looking for top talent',
      isOnboarded: true,
    },
  });

  const freelancer = await prisma.user.upsert({
    where: { stellarAddress: 'GFREELANCER1234567890123456789012345678901234567890' },
    update: {},
    create: {
      stellarAddress: 'GFREELANCER1234567890123456789012345678901234567890',
      role: Role.FREELANCER,
      username: 'bob',
      displayName: 'Bob Smith',
      bio: 'Full-stack developer with 5 years of experience',
      isOnboarded: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { stellarAddress: 'GADMIN1234567890123456789012345678901234567890123456' },
    update: {},
    create: {
      stellarAddress: 'GADMIN1234567890123456789012345678901234567890123456',
      role: Role.ADMIN,
      username: 'admin',
      displayName: 'Admin User',
      isOnboarded: true,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      title: 'Build a React Dashboard',
      description: 'Need a responsive admin dashboard built with React and Tailwind CSS.',
      status: ProjectStatus.IN_PROGRESS,
      escrowAmount: '5000',
      tokenSymbol: 'USDC',
      clientId: client.id,
      freelancerId: freelancer.id,
    },
  });

  const milestone1 = await prisma.milestone.upsert({
    where: { id: 'seed-milestone-1' },
    update: {},
    create: {
      id: 'seed-milestone-1',
      projectId: project.id,
      title: 'Design Mockups',
      description: 'Create wireframes and UI mockups for all pages',
      amount: '1000',
      status: MilestoneStatus.APPROVED,
    },
  });

  const milestone2 = await prisma.milestone.upsert({
    where: { id: 'seed-milestone-2' },
    update: {},
    create: {
      id: 'seed-milestone-2',
      projectId: project.id,
      title: 'Frontend Implementation',
      description: 'Implement the frontend components and pages',
      amount: '2500',
      status: MilestoneStatus.PENDING,
    },
  });

  await prisma.escrow.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      stellarEscrowId: 'SESCROWSEED001',
      contractId: 'CCONTRACTSEED001',
      clientAddress: client.stellarAddress,
      freelancerAddress: freelancer.stellarAddress,
      tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2Q2A5VCJ3G2TCHC4KN',
      amount: '5000',
      state: EscrowState.ACTIVE,
      milestoneCount: 2,
    },
  });

await prisma.notification.createMany({
    data: [
      {
        userId: freelancer.id,
        type: 'milestone_approved',
        title: 'Milestone Approved',
        body: 'Your milestone "Design Mockups" has been approved.',
      },
      {
        userId: client.id,
        type: 'project_started',
        title: 'Project Started',
        body: 'Bob has started working on "Build a React Dashboard".',
      },
      {
        userId: freelancer.id,
        type: 'payment_received',
        title: 'Payment Received',
        body: 'You received $1000 USDC for milestone "Design Mockups".',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: client.id,
        type: 'deposit',
        amount: '5000',
        tokenSymbol: 'USDC',
        status: 'completed',
        description: 'Project funding for "Build a React Dashboard"',
      },
      {
        userId: freelancer.id,
        type: 'payment',
        amount: '1000',
        tokenSymbol: 'USDC',
        status: 'completed',
        description: 'Payment for milestone "Design Mockups"',
      },
    ],
    skipDuplicates: true,
  });

  const existingIntegration = await prisma.integration.findFirst({
    where: { userId: client.id, plugin: 'github' },
  });
  if (!existingIntegration) {
    await prisma.integration.create({
      data: {
        userId: client.id,
        plugin: 'github',
        status: 'connected',
        scopes: ['repo', 'webhook'],
        metadata: { githubUsername: 'alice-dev' },
      },
    });
  }

  console.log('Seed data created successfully');
  console.log(`Client: ${client.stellarAddress}`);
  console.log(`Freelancer: ${freelancer.stellarAddress}`);
  console.log(`Admin: ${admin.stellarAddress}`);
  console.log(`Project: ${project.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
