import type { RunProps, RunnerCallbacks, RunnerReturn } from '../../../../../toolkit/Runner.types';
import type { ToolReturn } from '../../../../../toolkit/Tooling.types';
export function runTools(plan:RunProps[]|(()=>Promise<RunProps[]>),execute:(step:RunProps)=>ToolReturn|Promise<ToolReturn>,options?:RunnerCallbacks):Promise<RunnerReturn>;
