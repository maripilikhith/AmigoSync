const Group = require('../models/Group');
const Room = require('../models/Room');

const createGroup = async (req, res) => {
    const { groupName, roomId, initialMembers = [] } = req.body;
    try {
        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Optional: check if user is in the room before allowing group creation
        if (!room.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Must be a room member to create a group' });
        }

        // Check if a group with the same name already exists in this room
        const existingGroup = await Group.findOne({
            roomId,
            groupName: { $regex: new RegExp(`^${groupName}$`, 'i') } // Case-insensitive exact match
        });

        if (existingGroup) {
            return res.status(400).json({ message: `A subgroup named "${groupName}" already exists in this trip.` });
        }

        // Combine creator and selected initial members, filtering out duplicates
        const memberIds = [...new Set([req.user._id.toString(), ...initialMembers])];

        const group = await Group.create({
            groupName,
            roomId,
            members: memberIds,
            createdBy: req.user._id
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const joinGroup = async (req, res) => {
    const { groupId } = req.body;
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }

        group.members.push(req.user._id);
        await group.save();

        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const leaveGroup = async (req, res) => {
    const { groupId } = req.body;
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.members = group.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );
        await group.save();

        res.status(200).json({ message: 'Successfully left the group', group });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getRoomGroups = async (req, res) => {
    const { roomId } = req.params;
    try {
        const groups = await Group.find({ roomId }).populate('members', 'name email avatar');
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Fetch the room to check if the user is the room creator
        const Room = require('../models/Room');
        const room = await Room.findById(group.roomId);

        const isGroupCreator = group.createdBy && group.createdBy.toString() === req.user._id.toString();
        const isRoomCreator = room && room.createdBy && room.createdBy.toString() === req.user._id.toString();

        // Check if the user trying to delete is either the group creator OR the room creator
        if (!isGroupCreator && !isRoomCreator) {
            return res.status(403).json({ message: 'Only the creator of this subgroup or the trip owner can delete it.' });
        }

        // Delete the group
        await Group.findByIdAndDelete(groupId);

        // Clean up messages associated with the group
        const Message = require('../models/Message');
        await Message.deleteMany({ groupId });

        res.status(200).json({ message: 'Subgroup deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getOrCreateDM = async (req, res) => {
    const { roomId, targetUserId } = req.body;
    try {
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (!room.members.includes(req.user._id) || !room.members.includes(targetUserId)) {
            return res.status(403).json({ message: 'Both users must be in the room' });
        }

        // Look for an existing DM group
        const existingGroup = await Group.findOne({
            roomId,
            isDM: true,
            members: { $all: [req.user._id, targetUserId] }
        }).populate('members', 'name email avatar');

        if (existingGroup) {
            // Check if exactly 2 members
            if (existingGroup.members.length === 2) {
                return res.status(200).json(existingGroup);
            }
        }

        const group = await Group.create({
            groupName: 'DM',
            roomId,
            members: [req.user._id, targetUserId],
            isDM: true
        });

        const populatedGroup = await Group.findById(group._id).populate('members', 'name email avatar');

        res.status(201).json(populatedGroup);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createGroup, joinGroup, leaveGroup, getRoomGroups, deleteGroup, getOrCreateDM };
