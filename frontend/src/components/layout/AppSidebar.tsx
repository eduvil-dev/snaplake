import { useNavigate, useRouterState } from "@tanstack/react-router"
import {
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
} from "@carbon/react"
import {
  Dashboard,
  Db2Database,
  Layers,
  Search,
  Compare,
  Settings,
} from "@carbon/react/icons"

const mainNavItems = [
  { title: "Dashboard", icon: Dashboard, path: "/" },
  { title: "Datasources", icon: Db2Database, path: "/datasources" },
  { title: "Snapshots", icon: Layers, path: "/snapshots" },
  { title: "Query", icon: Search, path: "/query" },
  { title: "Compare", icon: Compare, path: "/compare" },
]

const settingsNavItems = [
  { title: "Storage", path: "/settings/storage" },
  { title: "Account", path: "/settings/account" },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isSettingsActive = currentPath.startsWith("/settings")

  return (
    <SideNav aria-label="Side navigation" isRail>
      <SideNavItems>
        {mainNavItems.map((item) => {
          const isActive =
            item.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.path)

          return (
            <SideNavLink
              key={item.path}
              renderIcon={item.icon}
              isActive={isActive}
              onClick={() => navigate({ to: item.path })}
            >
              {item.title}
            </SideNavLink>
          )
        })}

        <SideNavMenu
          renderIcon={Settings}
          title="Settings"
          isActive={isSettingsActive}
          defaultExpanded={isSettingsActive}
        >
          {settingsNavItems.map((item) => (
            <SideNavMenuItem
              key={item.path}
              isActive={currentPath.startsWith(item.path)}
              onClick={() => navigate({ to: item.path })}
            >
              {item.title}
            </SideNavMenuItem>
          ))}
        </SideNavMenu>
      </SideNavItems>
    </SideNav>
  )
}
