export type Action = {
  type: string;
  payload: any;
};

export interface State {
  isSidebarOpen: boolean;
}
