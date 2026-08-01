import { Mail, Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          MailVerify Pro
          <span className="hidden sm:inline-block ml-2 text-sm font-normal text-muted-foreground">
            — Email Verification Dashboard
          </span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
