import { LayoutDashboard, Users, Clapperboard, ChartNoAxesCombined, Wallet, Radar, Music2, BrainCircuit, FileChartColumn, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export type NavBadge = "new" | "soon";
export interface NavSubItem { id:string; title:string; url:string; icon?:LucideIcon; badge?:NavBadge; disabled?:boolean; newTab?:boolean }
interface NavItemBase { id:string; title:string; icon?:LucideIcon; badge?:NavBadge; disabled?:boolean; newTab?:boolean }
export interface NavMainLinkItem extends NavItemBase { url:string; subItems?:never }
export interface NavMainParentItem extends NavItemBase { subItems:NavSubItem[] }
export type NavMainItem = NavMainLinkItem | NavMainParentItem;
export interface NavGroup { id:number; label?:string; items:NavMainItem[] }
export const sidebarItems: NavGroup[] = [
 {id:1,label:"TRE NDSCOPE".replace(" ",""),items:[
 {id:"overview",title:"Visão geral",url:"/dashboard",icon:LayoutDashboard},
 {id:"accounts",title:"Minhas contas",url:"/dashboard/contas",icon:Users},
 {id:"videos",title:"Meus vídeos",url:"/dashboard/videos",icon:Clapperboard},
 {id:"analytics",title:"Analytics",url:"/dashboard/analises",icon:ChartNoAxesCombined},
 {id:"money",title:"Monetização",url:"/dashboard/monetizacao",icon:Wallet},
 {id:"trends",title:"Radar de tendências",url:"/dashboard/tendencias",icon:Radar},
 {id:"sounds",title:"Áudios em alta",url:"/dashboard/audios",icon:Music2},
 {id:"ai",title:"Laboratório IA",url:"/dashboard/laboratorio",icon:BrainCircuit},
 {id:"reports",title:"Relatórios",url:"/dashboard/relatorios",icon:FileChartColumn},
 ]}, {id:2,label:"SISTEMA",items:[{id:"settings",title:"Configurações",url:"/dashboard/configuracoes",icon:Settings}]}];
