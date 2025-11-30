const { User, Post } = require('../models/user');

exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            include: [{ model: Post, as: 'posts' }]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Post, as: 'posts' }]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.create({ name, email });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ name, email });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.destroy();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const post = await Post.create({ userId, title, content });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
