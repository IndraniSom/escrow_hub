/* Auth layout — centered, no sidebar */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16 px-4 bg-[#09090b] min-h-screen">
      {children}
    </div>
  );
}
