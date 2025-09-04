export type BankParseParam = {
  id: number;
  colDate: number;
  colDesc: number;
  colValSpent: number;
  colValEarned: number;
  colComment: number;
  source: string;
  removeDots: boolean;
  startRow: number;
  changeSignal: boolean;
  colCategory: string;
};
