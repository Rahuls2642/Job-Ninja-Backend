export interface AgentTool {
  name: string;
  execute(input: any, context?: any): Promise<any>;
}
