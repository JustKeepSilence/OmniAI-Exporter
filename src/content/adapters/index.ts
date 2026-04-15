import { type SiteAdapter } from "./base"
import { GeminiAdapter } from "./gemini"
import { DoubaoAdapter } from "./doubao"
import { ChatGPTAdapter } from './chatgpt'
import { DeepSeekAdapter } from "./deepseek"
import { YuanbaoAdapter } from "./yuanbao"
import {QianwenAdapter} from "./qianwen"

const availableAdapters: SiteAdapter[] = [
    new GeminiAdapter(),
    new DoubaoAdapter(),
    new ChatGPTAdapter(),
    new DeepSeekAdapter(),
    new YuanbaoAdapter(),
    new QianwenAdapter()
]

export const getActiveAdapter = (): SiteAdapter | undefined =>{

    return availableAdapters.find(adapter=>adapter.canHandle()) 

}