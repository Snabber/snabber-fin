export type Transaction = {
    transaction_id: number;
    date: string;
    description: string;
    amount: number;
    category: string;
    comment: string;
    account: string;
    userId: number;
};