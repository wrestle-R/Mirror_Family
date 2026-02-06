const Student = require('../models/Student');

const createOrUpdateStudent = async (req, res) => {
  try {
    const { firebaseUid, email, name, profilePhoto, contactNumber } = req.body;
    
    console.log('Auth request received:', { firebaseUid, email, name });

    if (!firebaseUid || !email) {
      console.error('Missing required fields:', { firebaseUid, email });
      return res.status(400).json({ 
        success: false, 
        message: 'Firebase UID and email are required' 
      });
    }

    let student = await Student.findOne({ firebaseUid });
    console.log('Existing student found:', student ? 'Yes' : 'No');

    if (student) {
      student.email = email;
      student.profilePhoto = profilePhoto || student.profilePhoto;
      student.contactNumber = contactNumber || student.contactNumber;
      // We don't overwrite name here to prevent reverting user changes
      // Name updates should happen via the profile update endpoint
      await student.save();
      console.log('Student updated:', student._id);
    } else {
      student = new Student({
        firebaseUid,
        email,
        name: name || email.split('@')[0],
        profilePhoto: profilePhoto || null,
        contactNumber: contactNumber || null
      });
      await student.save();
      console.log('New student created:', student._id);
    }

    res.status(200).json({
      success: true,
      message: student.isNew ? 'Student created successfully' : 'Student updated successfully',
      data: {
        id: student._id,
        firebaseUid: student.firebaseUid,
        email: student.email,
        name: student.name,
        profilePhoto: student.profilePhoto,
        contactNumber: student.contactNumber,
        isOnboarded: student.isOnboarded,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Auth controller error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getStudent = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    console.log('Get student request:', firebaseUid);

    const student = await Student.findOne({ firebaseUid });
    
    if (!student) {
      console.log('Student not found:', firebaseUid);
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    console.log('Student found:', student._id);
    res.status(200).json({
      success: true,
      data: {
        id: student._id,
        firebaseUid: student.firebaseUid,
        email: student.email,
        name: student.name,
        profilePhoto: student.profilePhoto,
        contactNumber: student.contactNumber,
        isOnboarded: student.isOnboarded,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const updateOnboardingStatus = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { isOnboarded } = req.body;
    
    console.log('Update onboarding status:', { firebaseUid, isOnboarded });

    const student = await Student.findOneAndUpdate(
      { firebaseUid },
      { isOnboarded },
      { new: true }
    );

    if (!student) {
      console.log('Student not found for onboarding update:', firebaseUid);
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    console.log('Onboarding status updated:', student._id);
    res.status(200).json({
      success: true,
      message: 'Onboarding status updated',
      data: {
        id: student._id,
        isOnboarded: student.isOnboarded
      }
    });

  } catch (error) {
    console.error('Update onboarding error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  createOrUpdateStudent,
  getStudent,
  updateOnboardingStatus
};
