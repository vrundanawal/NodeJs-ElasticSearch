const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

//Dummy Workout Data
const workouts = [
  { id: 1, type: 'weights - 1', duration: 30 },
  { id: 2, type: 'cardio - 2', duration: 40 },
  { id: 3, type: 'weights - 3', duration: 45 },
  { id: 4, type: 'cardio - 4', duration: 20 },
  { id: 5, type: 'weights - 5', duration: 35 },
];

router.use((req, res, next) => {
  //do the analysis here
  console.log('Time:', Date.now());
  console.log('Request Type:', req.method);
  console.log('Request URL:', req.url);
  next();
});

router.get('/', (req, res) => {
  res.send({ message: 'Welcome to the API!' });
});

// Index workouts into elastic search
workouts.forEach((workout) => {
  client.index(
    {
      index: 'workouts',
      id: workout.id,
      body: workout,
    },
    (err, result) => {
      if (err) console.error(err);
      else console.log(`Indexed workout ${workout.id}`);
    }
  );
});

// Get all workouts from Elasticsearch
router.get('/workouts', async (req, res) => {
  try {
    const result = await client.search({
      index: 'workouts',
      body: {
        query: {
          match_all: {},
        },
      },
      size: 10000, // Adjust the size as needed
    });

    if (result.hits && result.hits.hits) {
      const workouts = result.hits.hits.map((hit) => hit._source);
      return res.status(200).send({
        success: 'true',
        message: 'Get all workouts',
        workouts: workouts,
      });
    } else {
      return res.status(500).send({
        success: 'false',
        message: 'Failed to get workouts',
        error: 'Unexpected response structure',
      });
    }
  } catch (err) {
    console.error('Error fetching workouts:', err);
    return res.status(500).send({
      success: 'false',
      message: 'Failed to get workouts',
      error: err.message,
    });
  }
});
//get a single workout
router.get('/workouts/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await client.get({
      index: 'workouts',
      id: id,
    });

    return res.status(200).send({
      success: 'true',
      message: `Workout retrieved** successfully for id ${id}`,
      workout: result._source,
    });
  } catch (err) {
    console.error('Error retrieving workout:', err);
    if (err.meta.statusCode === 404) {
      return res.status(404).send({
        success: 'false',
        message: `Workout does not exist for id ${id}`,
      });
    }
    return res.status(500).send({
      success: 'false',
      message: 'Failed to retrieve workout',
      error: err.message,
    });
  }
});
//create a workout
//POST request
router.post('/workouts', async (req, res) => {
  const { id, type, duration } = req.body;
  const workout = req.body;

  if (!id || !type || !duration) {
    return res.status(400).send({
      success: 'false',
      message: 'All fields are required: id, type, duration',
    });
  }

  // Check if the workout with the given ID already exists in the elasticsearch index

  const workouts = await client.search({
    index: 'workouts',
    body: {
      query: {
        match: {
          id: id,
        },
      },
    },
  });

  try {
    if (workouts.hits.total.value > 0) {
      return res.status(409).send({
        success: 'false',
        message: `Workout with id ${id} already exists`,
      });
    }

    return client
      .index({
        index: 'workouts',
        id: id,
        body: workout,
      })
      .then(() => {
        return res.status(201).send({
          success: 'true',
          message: 'Workout added successfully',
          workout: req.body,
        });
      })
      .catch((err) => {
        console.error('Error adding workout:', err);
        return res.status(500).send({
          success: 'false',
          message: 'Failed to add workout',
          error: err.message,
        });
      });
  } catch (err) {
    console.error('Error adding workout:', err);
    return res.status(500).send({
      success: 'false',
      message: 'Failed to add workout',
      error: err.message,
    });
  }
});
//update a workout
//PUT request
router.put('/workouts/:id', async (req, res) => {
  const { id } = req.params;
  const { type, duration } = req.body;

  if (!type || !duration || !id) {
    return res.status(400).send({
      success: 'false',
      message: 'All fields are required: type, duration, ',
    });
  }

  try {
    const result = await client.update({
      index: 'workouts',
      id: id,
      body: {
        doc: {
          type,
          duration,
        },
      },
    });

    return res.status(200).send({
      success: 'true',
      message: 'Workout updated successfully',
      workouts: req.body,
    });
  } catch (err) {
    console.error('Error updating workout:', err);
    return res.status(500).send({
      success: 'false',
      message: 'Failed to update workout',
      error: err.message,
    });
  }
});

//delete a workout
//DELETE request
router.delete('/workouts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.delete({
      index: 'workouts',
      id: id,
    });

    return res.status(200).send({
      success: 'true',
      message: 'Workout deleted successfully',
      result,
    });
  } catch (err) {
    console.error('Error deleting workout:', err);
    return res.status(500).send({
      success: 'false',
      message: 'Failed to delete workout',
      error: err.message,
    });
  }
});

module.exports = router;
