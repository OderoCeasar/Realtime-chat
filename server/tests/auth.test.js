const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/userModel');


let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});


afterEach(async () => {
    await User.deleteMany({});
});


afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});


// Register User
describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
        const res = await request(app).post('/api/auth/register').send({
            firstname: 'test',
            lastname: 'user',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        const user = await User.findOne({ email: 'testuser@example.com' });
        expect(user).not.toBeNull();
    });


    it('should not register existing user', async () => {
        await User.create({
            name: 'test user',
            email: 'testuser@example.com',
            password: 'password123',
        });

        const res = await request(app).post('/api/auth/register').send({
            firstname: 'test',
            lastname: 'user',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'user already exists');
    });
});


// Login User
describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        const user = new User({
            name: 'test user',
            email: 'testuser@example.com',
            password: 'password123',
        });
        await user.save();
    });

    it('should login with correct credentails', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'testuser@example.com',
            password: 'wrongPassword',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Invalid Credentials');
    });


});


// Validate USer token
describe('GET /api/auth/valid-user', () => {
    it('should return user if valid token is present', async () => {
        const user = new user({
            name: 'test user',
            email: 'testuser@example.com',
            password: 'password123',
        });
        const token = await user.generateAuthToken();
        await user.save();


        const res = await request(app)
           .get('/api/auth/valid-user')
           .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe('testuser@example.com');   
    });
});



// Search users
describe('GET /api/auth/search', () => {
    it('should return matching users', async () => {
        await User.create([
            { name: 'George Ceasar', email: 'oderoceasar@gmail.com', password: 'ceasar' },
            { name: 'John Doe', email: 'johndoe@gmail.com', password: 'doe' },
        ]);

        const res = await request(app).get('/api/auth/search').query({ search: 'George' });
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].email).toBe('oderoceasar@gmail.com')
    });
});



// Get user by ID
describe('GET /api/auth/:id', () => {
    it('should return user info without the password', async () => {
        const user = await User.create({
            name: 'test',
            email: 'testuser@example.com',
            password: 'pass',
        });

        const res = await request(app).get(`/api/auth/${user._id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('email', 'testuser@example.com');
        expect(res.body).not.toHaveProperty('password');
    });
});



// update user info
describe('PATCH /api/auth/:id', () => {
    it('should update user name and bio', async () => {
        const user = await User.create({
            name: 'Old Name',
            email: 'update@example.com',
            password: 'pass',
            bio: 'old bio',
        });

        const res = await request(app)
          .patch(`/api/auth/${user._id}`)
          .send({ name: 'New Name', bio: 'New Bio'});

        
        expect(res.statusCode).toBe(200);
        const updated = await User.findById(user._id);
        expect(updated.name).toBe('New Name');
        expect(updated.bio).toBe('New Bio');  
    });
});