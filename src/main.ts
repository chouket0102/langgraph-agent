import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createAndSetupCheckpointer } from './checkpointer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Prefix all routes with 'api'
  app.setGlobalPrefix('api');
  // Configure CORS from environment or use defaults
  const allowedOrigins =  [
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  });

  const checkpointer = await createAndSetupCheckpointer();

  // Pass checkpointer to AgentFactory or wherever needed
  // Example:
  // const agent = AgentFactory.createAgent(ModelProvider.OPENAI, tools, checkpointer);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
