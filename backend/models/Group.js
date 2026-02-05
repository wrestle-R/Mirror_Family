const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 6,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
groupSchema.index({ owner: 1, isActive: 1 });
groupSchema.index({ members: 1, isActive: 1 });

// Generate unique invite code
groupSchema.statics.generateInviteCode = async function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists = true;

  while (exists) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingGroup = await this.findOne({ inviteCode: code });
    exists = !!existingGroup;
  }

  return code;
};

// Method to check if user is owner
groupSchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};

// Method to check if user is member
groupSchema.methods.isMember = function (userId) {
  return this.members.some((member) => member.toString() === userId.toString());
};

// Method to add member
groupSchema.methods.addMember = async function (userId) {
  if (!this.isMember(userId) && !this.isOwner(userId)) {
    this.members.push(userId);
    await this.save();
  }
};

// Method to remove member
groupSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (member) => member.toString() !== userId.toString(),
  );
  await this.save();
};

// Pre-save hook to ensure owner is not in members array
groupSchema.pre("save", function (next) {
  if (this.isModified("members") || this.isModified("owner")) {
    this.members = this.members.filter(
      (member) => member.toString() !== this.owner.toString(),
    );
  }
  next();
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
