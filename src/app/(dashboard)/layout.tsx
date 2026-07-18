import Link from "next/link";
import { 
  LayoutDashboard, 
  FolderGit2, 
  PlusSquare, 
  Wallet, 
  Bell, 
  Workflow, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full border-struct-t">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-struct-b lg:border-struct-b-0 lg:border-struct-r bg-[#09090b] shrink-0">
        <div className="p-6 sticky top-20 space-y-6">
          {/* Wallet pill */}
          <Link href="/dashboard/wallet" className="flex items-center gap-3 border border-[#27272a] p-3 hover:border-orange-600/50 transition-all duration-300 ease-in-out group bg-[#111113]">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-bold">Connected Wallet</p>
              <p className="text-xs font-mono text-white truncate">GDEMO...XLM123</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-orange-600 transition-colors duration-300 ease-in-out" />
          </Link>

          {/* Main nav */}
          <div>
            <h2 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3 pb-2 border-b border-[#27272a]">Main Menu</h2>
            <nav className="flex flex-col gap-1 text-sm uppercase tracking-wider">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <FolderGit2 className="w-4 h-4" />
                <span>My Projects</span>
              </Link>
              <Link href="/dashboard/projects/create" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <PlusSquare className="w-4 h-4" />
                <span>Post a Project</span>
              </Link>
              <Link href="/dashboard/wallet" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <Wallet className="w-4 h-4" />
                <span>Wallet</span>
              </Link>
              <Link href="/dashboard/notifications" className="flex items-center justify-between px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600 group">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                <span className="bg-orange-600 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-sm">2</span>
              </Link>
            </nav>
          </div>

          {/* Integrations section */}
          <div>
            <h2 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3 pb-2 border-b border-[#27272a]">Integrations</h2>
            <nav className="flex flex-col gap-1 text-sm uppercase tracking-wider">
              <Link href="/dashboard/integrations" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <Workflow className="w-4 h-4" />
                <span>Apps & Webhooks</span>
              </Link>
            </nav>
          </div>

          {/* Account section */}
          <div>
            <h2 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3 pb-2 border-b border-[#27272a]">Account</h2>
            <nav className="flex flex-col gap-1 text-sm uppercase tracking-wider">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1c] hover:text-white transition-all duration-200 ease-in-out font-bold text-[#a1a1aa] border-l-2 border-transparent hover:border-orange-600">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </a>
              <Link href="/sign-in" className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ease-in-out font-bold text-red-500 border-l-2 border-transparent hover:border-red-500">
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#111113] min-w-0">
        {children}
      </div>
    </div>
  );
}
