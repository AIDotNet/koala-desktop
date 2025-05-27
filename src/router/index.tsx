import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Home from '../pages/Home/index'
import Settings from '../pages/Settings'
import ProviderDemo from '../components/ProviderDemo'
import ZustandTestPage from '../pages/Home/ZustandTestPage'
import SessionManagerExample from '../pages/Home/SessionManagerExample'

interface RouteWrapperProps {
  children: React.ReactElement
  isDarkTheme: boolean
  onThemeChange?: (isDark: boolean) => void
  addSettingsTab?: () => void
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({ children, isDarkTheme, onThemeChange, addSettingsTab }) => {
  return React.cloneElement(children, { isDarkTheme, onThemeChange, addSettingsTab })
}

export const createAppRouter = (isDarkTheme: boolean, onThemeChange: (isDark: boolean) => void, addSettingsTab?: () => void) => {
  return createBrowserRouter([
    {
      path: '/',
      element: (
        <RouteWrapper isDarkTheme={isDarkTheme} addSettingsTab={addSettingsTab}>
          <Home isDarkTheme={isDarkTheme} />
        </RouteWrapper>
      )
    },
    {
      path: '/chat/:sessionId',
      element: (
        <RouteWrapper isDarkTheme={isDarkTheme} addSettingsTab={addSettingsTab}>
          <Home isDarkTheme={isDarkTheme} />
        </RouteWrapper>
      )
    },
    {
      path: '/settings',
      element: (
        <RouteWrapper isDarkTheme={isDarkTheme}>
          <Settings isDarkTheme={isDarkTheme} />
        </RouteWrapper>
      )
    },
    {
      path: '/providers',
      element: <ProviderDemo />
    },
    {
      path: '/zustand-test',
      element: <ZustandTestPage />
    },
    {
      path: '/session-example',
      element: <SessionManagerExample />
    },
    {
      path: '/home',
      element: <Navigate to="/" replace />
    },
    {
      path: '*',
      element: <Navigate to="/" replace />
    }
  ])
}

export default createAppRouter 