const MeetingHistory = require('../../model/schema/meeting');
const mongoose = require('mongoose');
const User = require('../../model/schema/user');

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
        query.deleted = false; // Exclude deleted meetings by default

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
                    as: 'attendesDetails'
                }
            },
            {
                $lookup: {
                    from: 'Lead',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendesLeadDetails'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendesDetails', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendesLeadDetails', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendesNames: { 
                        $cond: {
                            if: { $ne: [{ $size: "$attendesDetails" }, 0] },
                            then: { $concat: ['$attendesDetails.firstName', ' ', '$attendesDetails.lastName'] },
                            else: ''
                        }
                    },
                    attendesLeadNames: { 
                        $cond: {
                            if: { $ne: [{ $size: "$attendesLeadDetails" }, 0] },
                            then: { $concat: ['$attendesLeadDetails.firstName', ' ', '$attendesLeadDetails.lastName'] },
                            else: ''
                        }
                    }
                }
            },
            {
                $project: {
                    users: 0,
                    attendesDetails: 0,
                    attendesLeadDetails: 0
                }
            }
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to fetch meeting histories:', err);
        res.status(400).json({ err, error: 'Failed to fetch meeting histories' });
    }
}

// View specific meeting history
const view = async (req, res) => {
    try {
        const result = await MeetingHistory.findOne({ _id: req.params.id });
        if (!result) return res.status(404).json({ message: "No data found." });

        const response = await MeetingHistory.aggregate([
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
                    as: 'attendesDetails'
                }
            },
            {
                $lookup: {
                    from: 'Lead',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendesLeadDetails'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendesDetails', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$attendesLeadDetails', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendesNames: { 
                        $cond: {
                            if: { $ne: [{ $size: "$attendesDetails" }, 0] },
                            then: { $concat: ['$attendesDetails.firstName', ' ', '$attendesDetails.lastName'] },
                            else: ''
                        }
                    },
                    attendesLeadNames: { 
                        $cond: {
                            if: { $ne: [{ $size: "$attendesLeadDetails" }, 0] },
                            then: { $concat: ['$attendesLeadDetails.firstName', ' ', '$attendesLeadDetails.lastName'] },
                            else: ''
                        }
                    }
                }
            },
            {
                $project: {
                    users: 0,
                    attendesDetails: 0,
                    attendesLeadDetails: 0
                }
            }
        ]);

        res.status(200).json(response[0]);
    } catch (err) {
        console.error('Failed to fetch meeting history:', err);
        res.status(400).json({ err, error: 'Failed to fetch meeting history' });
    }
}

// Delete single meeting history
const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "Meeting history deleted", result: result });
    } catch (err) {
        console.error('Error deleting meeting history:', err);
        res.status(404).json({ message: "Error", err });
    }
}

// Delete many meeting history records
const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
        res.status(200).json({ message: "Deleted successfully", result });
    } catch (err) {
        console.error('Error deleting meeting histories:', err);
        res.status(404).json({ message: "Error", err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany };
