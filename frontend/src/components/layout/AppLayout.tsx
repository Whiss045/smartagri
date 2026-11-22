import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import SideMenu from "./SideMenu";
import s from "./layout.module.css";

// Frame shared by every logged-in page; the page itself renders inside <Outlet />
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.shell}>
      <Header onMenu={() => setOpen((o) => !o)} />
      <SideMenu open={open} onNavigate={() => setOpen(false)} />
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
