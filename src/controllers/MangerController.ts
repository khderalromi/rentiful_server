const User = require('./../models/user');
const AppError = require('./../utils/appError');

exports.getManger = async (req:any, res:any) => {
    try {
        // مثال لتحديث حقل الصورة في الدالة
        const doctors = await User.findOne(req.user.congitoId);
        res.status(200).json(doctors);
    } catch (err:any) {
        res.status(500).json({ message: err.message });
    }
};

/***[جلب عقارات هذا المدير حصريا] */
