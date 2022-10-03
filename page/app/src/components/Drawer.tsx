import { Drawer as DaisyDrawer } from "react-daisyui";
import { SideBar } from "./SideBar";

export const Drawer = ({ children, isOpen, handler }: any) => {
  return (
    <DaisyDrawer
      side={<SideBar />}
      open={isOpen}
      onClickOverlay={() => handler({ isOpen })}
      mobile
    >
      <div className="h-100 px-6">{children}</div>
    </DaisyDrawer>
  );
};
