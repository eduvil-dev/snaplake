import { Outlet } from "@tanstack/react-router"
import { Content } from "@carbon/react"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { ShortcutHelp } from "@/components/common/ShortcutHelp"

export function AppLayout() {
  return (
    <>
      <AppHeader />
      <AppSidebar />
      <Content className="app-content">
        <Outlet />
      </Content>
      <ShortcutHelp />
    </>
  )
}
