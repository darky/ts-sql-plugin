import tss from 'typescript/lib/tsserverlibrary';
import { Tags } from './make_fake_expression';
export interface TsSqlPluginConfig {
    error_cost?: number;
    warn_cost?: number;
    info_cost?: number;
    cost_pattern?: string;
    command: string[];
    tags: Tags;
}
export declare function create(info: tss.server.PluginCreateInfo): tss.LanguageService;
