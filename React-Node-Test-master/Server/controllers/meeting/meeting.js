const MeetingHistory = require('../../model/schema/meeting');
const mongoose = require('mongoose');

// Add new meeting history
const add = async (req, res) => {
    try {
        const result = new MeetingHistory(req.body);
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create meeting history:', err);
        res.status(400).json({ err, error: 'Failed to create meeting history' });
    }
}

// Get all meeting history records (with some filtering)
const index = async (req, res) => {
    try {
        const query = req.query;
        query.deleted = false;

        const user = await User.findById(req.user.userId);
        if (user?.role !== "superAdmin") {
            delete query.createBy;
            query.$or = [{ createBy: new mongoose.Types.ObjectId(req.user.userId) }];
        }

        const result = await MeetingHistory.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $lookup: {
                    from: 'Contact',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendeesData'
                }
            },
            {
                $lookup: {
                    from: 'Lead',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendeesLeadData'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendeesData', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendeesLeadData', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendeesNames: {
                        $cond: {
                            if: '$attendeesData',
                            then: { $concat: ['$attendeesData.firstName', ' ', '$attendeesData.lastName'] },
                            else: { $concat: [''] }
                        }
                    },
                    attendeesLeadNames: {
                        $cond: {
                            if: '$attendeesLeadData',
                            then: { $concat: ['$attendeesLeadData.firstName', ' ', '$attendeesLeadData.lastName'] },
                            else: { $concat: [''] }
                        }
                    }
                }
            },
            {
                $project: {
                    users: 0,
                    attendeesData: 0,
                    attendeesLeadData: 0
                }
            }
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to fetch meetings:', err);
        res.status(400).json({ err, error: 'Failed to fetch meetings' });
    }
}

// View specific meeting history
const view = async (req, res) => {
    try {
        const result = await MeetingHistory.findOne({ _id: req.params.id });
        if (!result) return res.status(404).json({ message: "No Data Found." });

        let response = await MeetingHistory.aggregate([
            { $match: { _id: result._id } },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $lookup: {
                    from: 'Contact',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendeesData'
                }
            },
            {
                $lookup: {
                    from: 'Lead',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendeesLeadData'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendeesData', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendeesLeadData', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendeesNames: {
                        $cond: {
                            if: '$attendeesData',
                            then: { $concat: ['$attendeesData.firstName', ' ', '$attendeesData.lastName'] },
                            else: { $concat: [''] }
                        }
                    },
                    attendeesLeadNames: {
                        $cond: {
                            if: '$attendeesLeadData',
                            then: { $concat: ['$attendeesLeadData.firstName', ' ', '$attendeesLeadData.lastName'] },
                            else: { $concat: [''] }
                        }
                    }
                }
            },
            {
                $project: {
                    users: 0,
                    attendeesData: 0,
                    attendeesLeadData: 0
                }
            }
        ]);

        res.status(200).json(response[0]);
    } catch (err) {
        console.error('Failed to view meeting:', err);
        res.status(400).json({ err, error: 'Failed to view meeting' });
    }
}

// Delete single meeting history
const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "done", result: result });
    } catch (err) {
        res.status(404).json({ message: "error", err });
    }
}

// Delete many meeting history records
const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
        res.status(200).json({ message: "done", result });
    } catch (err) {
        res.status(404).json({ message: "error", err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany };
