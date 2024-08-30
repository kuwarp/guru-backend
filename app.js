require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL).then((e)=>{
  console.log("Connected to kuwarp");
  
});

// Define the schema
const projectSchema = new mongoose.Schema({
  hero: {
    name: String,
    address: String,
    price: String,
    images: [String],
  },
  overview: {
    sectionTitle: String,
    content: [
      {
        heading: String,
        paragraph: String,
      },
    ],
  },
  whyInvest: {
    points: [String],
  },
  amenities: [
    {
      icon: String,
      name: String,
    },
  ],
  brochure: {
    link: String,
    file: String,
  },
  video: {
    url: String,
  },
  MapLink: {
    url: String,
  },
  FAQ: {
    points: [String],
  },
});

const Project = mongoose.model('Project', projectSchema);

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'brochure', maxCount: 1 },
  { name: 'amenitiesIcons', maxCount: 10 },
]);

app.post('/api/projects', upload, async (req, res) => {
  try {
    const { hero, overview, whyInvest, amenities, brochure, video, MapLink, FAQ } = req.body;
    const project = new Project({
      hero: {
        ...hero,
        images: req.files['images'] ? req.files['images'].map(file => file.filename) : [],
      },
      overview,
      whyInvest,
      amenities: amenities.map((amenity, index) => ({
        name: amenity.name,
        icon: req.files['amenitiesIcons'] && req.files['amenitiesIcons'][index] ? req.files['amenitiesIcons'][index].filename : '',
      })),
      brochure: {
        link: brochure.link,
        file: req.files['brochure'] ? req.files['brochure'][0].filename : '',
      },
      video,
      MapLink,
      FAQ,
    });
    await project.save();
    res.status(201).send(project);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).send(projects);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.put('/api/projects/:id', upload, async (req, res) => {
  try {
    const { hero, overview, whyInvest, amenities, brochure, video, MapLink, FAQ } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.hero = {
      ...project.hero,
      ...hero,
      images: req.files['images'] ? req.files['images'].map(file => file.filename) : project.hero.images,
    };

    project.overview = overview || project.overview;
    project.whyInvest = whyInvest || project.whyInvest;

    project.amenities = amenities.map((amenity, index) => ({
      name: amenity.name,
      icon: req.files['amenitiesIcons'] && req.files['amenitiesIcons'][index] ? req.files['amenitiesIcons'][index].filename : project.amenities[index]?.icon,
    }));

    project.brochure = {
      link: brochure.link || project.brochure.link,
      file: req.files['brochure'] ? req.files['brochure'][0].filename : project.brochure.file,
    };

    project.video = video || project.video;
    project.MapLink = MapLink || project.MapLink;
    project.FAQ = FAQ || project.FAQ;

    await project.save();
    res.status(200).send(project);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.use('/uploads', express.static('uploads'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(process.env.PORT, () => {
  console.log('Server is running on port 5000');
});
