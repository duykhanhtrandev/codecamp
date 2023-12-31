const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Please add a title fo the review"],
      maxLength: 100,
    },
    text: {
      type: String,
      require: [true, "Please add some text"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, "Please add a rating between 1 and 10"],
    },
    bootcamp: {
      type: mongoose.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    await this.model("Bootcamp").findOneAndUpdate(
      { _id: bootcampId },
      {
        averageRating: obj[0].averageRating,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

// Call getAverageRating after save
ReviewSchema.post("save", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("deleteOne", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
