"use client"

import * as React from "react"
import { UploadIcon, UsersIcon, SettingsIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentSection?: 'import' | 'leads' | 'settings';
  onSectionChange?: (section: 'import' | 'leads' | 'settings') => void;
}

export function AppSidebar({ currentSection = 'import', onSectionChange, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-border/50 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-lg shadow-sm">
                G
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">GrowEasy</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentSection === 'import'}
              onClick={() => onSectionChange?.('import')}
              className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-all"
            >
              <UploadIcon className="h-4 w-4" />
              <span>Import CSV</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentSection === 'leads'}
              onClick={() => onSectionChange?.('leads')}
              className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-all"
            >
              <UsersIcon className="h-4 w-4" />
              <span>Manage Leads</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentSection === 'settings'}
              onClick={() => onSectionChange?.('settings')}
              className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-all"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4 flex flex-row items-center gap-2.5 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
            GE
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none">Admin User</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">admin@groweasy.ai</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
