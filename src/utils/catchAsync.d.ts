import { type Request, type Response, type NextFunction } from 'express';
declare const catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export default catchAsync;
//# sourceMappingURL=catchAsync.d.ts.map