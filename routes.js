const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
client.ping({}, (err) => {
  if (err) {
    console.error('Elasticsearch cluster is down!', err);
  } else {
    console.log('Elasticsearch cluster is up and running!');
  }
});
//index a document
client.index(
  {
    index: 'myindex',
    body: {
      title: 'My Document',
      content: 'This is my old document',
    },
  },
  (err, result) => {
    if (err) console.error(err);
    else console.log(result);
  }
);

// Search for documents
client.search(
  {
    index: 'myindex',
    body: {
      query: {
        match: { title: 'My Document' },
      },
    },
  },
  (err, result) => {
    if (err) console.error(err);
    else console.log(result.body.hits.hits);
  }
);

const workouts = [
  { id: 1, type: 'weights - 1', duration: 30, date: '2020-01-01' },
  { id: 2, type: 'cardio - 2', duration: 40, date: '2021-01-02' },
  { id: 3, type: 'weights - 3', duration: 45, date: '2022-01-03' },
  { id: 4, type: 'cardio - 4', duration: 20, date: '2023-01-04' },
  { id: 5, type: 'weights - 5', duration: 35, date: '2024-01-05' },
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
// router.post('/workouts', (req, res) => {
//   if (!req.body.id) {
//     return res.status(400).send({
//       success: 'false',
//       message: 'ID is required',
//     });
//   } else if (!req.body.type) {
//     return res.status(400).send({
//       success: 'false',
//       message: 'type is required',
//     });
//   } else if (!req.body.duration) {
//     return res.status(400).send({
//       success: 'false',
//       message: 'duration is required',
//     });
//   } else if (!req.body.date) {
//     return res.status(400).send({
//       success: 'false',
//       message: 'date is required',
//     });
//   }

//   const workout = {
//     id: workouts.length + 1,
//     type: req.body.type,
//     duration: req.body.duration,
//     date: req.body.date,
//   };

//   workouts.push(workout);
//   return res.status(201).send({
//     success: 'true',
//     message: 'workout added successfully',
//     workout,
//   });

//   //   client.index(
//   //     {
//   //       index: 'workouts',
//   //       type: 'mytype',
//   //       id: workout.id,
//   //       body: workout,
//   //     },
//   //     function (err, resp, status) {
//   //       if (err) {
//   //         console.log(err);
//   //       } else {
//   //         return res.status(201).send({
//   //           success: 'true',
//   //           message: 'workout added successfully',
//   //           workout,
//   //         });
//   //       }
//   //     }
//   //   );
// });
router.post('/workouts', async (req, res) => {
  const { id, type, duration } = req.body;

  if (!id || !type || !duration) {
    return res.status(400).send({
      success: 'false',
      message: 'All fields are required: id, name, duration',
    });
  }

  try {
    const result = await client.index({
      index: 'workouts',
      body: {
        id,
        type,
        duration,
      },
    });

    return res.status(201).send({
      success: 'true',
      message: 'Workout added successfully',
      result,
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
      message: 'All fields are required: name, duration, calories',
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
      result,
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
