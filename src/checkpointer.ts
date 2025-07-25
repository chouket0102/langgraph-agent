import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

export async function createAndSetupCheckpointer(): Promise<PostgresSaver> {
  const checkpointer = PostgresSaver.fromConnString(process.env.POSTGRES_URL!);
  await checkpointer.setup();
  console.log('✅ LangGraph Postgres tables are ready!');
  return checkpointer;
}