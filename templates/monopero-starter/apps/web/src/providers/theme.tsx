 
import  React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

  function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider;