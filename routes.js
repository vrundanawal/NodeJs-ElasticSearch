const express = require('express');
const router = express.Router();

const workouts = [
  { id: 1, type: 'weights', duration: 30, date: '2020-01-01' },
  { id: 2, type: 'cardio', duration: 40, date: '2021-01-02' },
  { id: 3, type: 'weights', duration: 45, date: '2022-01-03' },
  { id: 4, type: 'cardio', duration: 20, date: '2023-01-04' },
  { id: 5, type: 'weights', duration: 35, date: '2024-01-05' },
];

router.use((req, res, next) => {
  //do the analysis here
  console.log('Time:', Date.now());
  console.log('Request Type:', req.method);
  console.log('Request URL:', req.url);
  next();
});

//get all workouts
router.get('/workouts', (req, res) => {
  return res.status(200).send({
    success: 'true',
    message: 'Get all workouts',
    workouts: workouts,
  });
});

//get a single workout
router.get('/workouts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const workout = workouts.find((workout) => workout.id === id);

  if (!workout) {
    return res.status(404).send({
      success: 'false',
      message: `workout does not exist for id ${id}`,
    });
  }

  return res.status(200).send({
    success: 'true',
    message: `workout retrieved successfully for id ${id}`,
    workout,
  });
});

//create a workout
//POST request
router.post('/workouts', (req, res) => {
  if (!req.body.id) {
    return res.status(400).send({
      success: 'false',
      message: 'ID is required',
    });
  } else if (!req.body.type) {
    return res.status(400).send({
      success: 'false',
      message: 'type is required',
    });
  } else if (!req.body.duration) {
    return res.status(400).send({
      success: 'false',
      message: 'duration is required',
    });
  } else if (!req.body.date) {
    return res.status(400).send({
      success: 'false',
      message: 'date is required',
    });
  }

  const workout = {
    id: workouts.length + 1,
    type: req.body.type,
    duration: req.body.duration,
    date: req.body.date,
  };

  workouts.push(workout);
  return res.status(201).send({
    success: 'true',
    message: 'workout added successfully',
    workout,
  });
});

//update a workout
//PUT request
router.put('/workouts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const workout = workouts.find((workout) => workout.id === id);

  if (!workout) {
    return res.status(404).send({
      success: 'false',
      message: `workout does not exist for id ${id}`,
    });
  }

  const updatedWorkout = {
    id: workout.id,
    type: req.body.type || workout.type,
    duration: req.body.duration || workout.duration,
    date: req.body.date || workout.date,
  };

  const index = workouts.indexOf(workout);
  workouts[index] = updatedWorkout;

  return res.status(200).send({
    success: 'true',
    message: `workout ${req.params.id} updated successfully`,
    updatedWorkout,
  });
});

//delete a workout
//DELETE request
router.delete('/workouts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const workout = workouts.find((workout) => workout.id === id);

  if (!workout) {
    return res.status(404).send({
      success: 'false',
      message: `workout does not exist for id ${id}`,
    });
  }

  const index = workouts.indexOf(workout);
  workouts.splice(index, 1);

  return res.status(200).send({
    success: 'true',
    message: `workout ${req.params.id} deleted successfully`,
  });
});

module.exports = router;
