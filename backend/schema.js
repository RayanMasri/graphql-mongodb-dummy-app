const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const AUTH_DURATION = 30; // In days
// const AUTH_DURATION = 0.00011574074; // In days

const isExpired = (timestamp) => {
	if (timestamp == '' || timestamp == null) return true;

	let compareDate = new Date(parseInt(timestamp) * 1000);
	let currentDate = new Date(Date.now());

	return currentDate - compareDate >= 0;
};

const hashPassword = (password) => {
	return new Promise((resolve, reject) => {
		bcrypt.hash(password, saltRounds, function (err, hash) {
			if (err) return reject(err);
			resolve(hash);
			// Store hash in your password DB.
		});
	});
};

const UserSchema = mongoose.Schema({
	email: String,
	password: String,
	auth_key: String,
	auth_expiry: Number,
});

UserSchema.methods.comparePassword = function (password) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, this.password, (error, result) => {
			if (error) return reject(error);
			resolve(result);
		});
	});
};

const NotesSchema = mongoose.Schema({
	user: String,
	notes: [
		{
			content: String,
			title: String,
		},
	],
});

let User;
try {
	User = mongoose.model('users');
} catch (error) {
	User = mongoose.model('users', UserSchema);
}

let Notes;
try {
	Notes = mongoose.model('notes');
} catch (error) {
	Notes = mongoose.model('notes', NotesSchema);
}

const typeDefs = `#graphql
    type User {
        _id: String,
        email: String,
        password: String
        auth_key: String,
        auth_expiry: String
    }

    type Note {
        _id: String
        content: String
		title: String
    }

    type Notes {
		user: String,
        notes: [Note]
    }

    type Query {
        notes(authKey: String): Notes
        users: [User]
		authenticate(authKey: String): User
    }

    type Mutation {
        signup(email: String, password: String): User
		signout(authKey: String): String
        login(email: String, password: String): User
        addNote(authKey: String, title: String, content: String): Note
		deleteNote(authKey: String, id: String): ID
		editNote(authKey: String, id: String, title: String, content: String): Note
    }
`;

const resolvers = {
	Query: {
		authenticate: async (_, args) => {
			let { authKey } = args;
			if (authKey == null || authKey.trim() == '') return;

			let user = await User.findOne({ auth_key: authKey });
			if (user == null) return null;
			if (isExpired(user.auth_expiry)) return null;

			return user;
		},
		notes: async (_, args) => {
			let { authKey } = args;
			if (authKey == null || authKey.trim() == '') return;

			// Find user
			let user = await User.findOne({ auth_key: authKey });
			if (user == null) return null;
			if (isExpired(user.auth_expiry)) return null;

			// Get notes
			let notes = await Notes.findOne({ user: user._id });
			if (notes == null) return null;

			return notes;
		},
		users: async () => {
			let users = await User.find({});
			return users;
		},
	},
	Mutation: {
		signup: async (_, args, context) => {
			let { email, password } = args;
			console.log(context);
			console.log(args);
			console.log(_);

			if (email == null || email.trim() == '' || password == null || password.trim() == '') return null;

			// If user exists, ignore
			let result = await User.findOne({ email: email });
			if (result != null) return null;

			// Hash password
			let hashed = await hashPassword(password);

			// Generate auth
			let authExpiry = Math.floor(Date.now() / 1000);
			authExpiry += AUTH_DURATION * 24 * 60 * 60;
			let authKey = uuidv4();

			// Create new user
			let user = new User({
				email: email,
				password: hashed,
				auth_key: authKey,
				auth_expiry: authExpiry,
			});
			await user.save();

			// Create new notes object
			let notes = new Notes({
				user: user._id,
				notes: [],
			});
			await notes.save();

			return user;
		},
		login: async (_, args) => {
			let { email, password } = args;
			// If user doesn't exist, ignore
			let user = await User.findOne({ email: email });
			if (user == null) return null;

			// Compare to looked up user
			let result = await user.comparePassword(password);
			if (!result) return null;

			// Generate new auth
			let authExpiry = Math.floor(Date.now() / 1000);
			authExpiry += AUTH_DURATION * 24 * 60 * 60;
			let authKey = uuidv4();

			// Update user auth
			user.auth_key = authKey;
			user.auth_expiry = authExpiry;
			await user.save();

			return user;
		},
		signout: async (_, args) => {
			let { authKey } = args;
			if (authKey == null || authKey.trim() == '') return;

			// If auth doesn't exist or is expired, ignore
			let result = await User.findOne({ auth_key: authKey });
			if (result == null) return null;
			if (isExpired(result.auth_expiry)) return null;

			// Remove auth
			result.auth_key = '';
			result.auth_expiry = '';
			await result.save();

			return authKey;
		},
		addNote: async (_, args) => {
			let { authKey, content, title } = args;
			if (authKey == null || authKey.trim() == '') return;

			// Find user
			let user = await User.findOne({ auth_key: authKey });
			if (user == null) return null;
			if (isExpired(user.auth_expiry)) return null;

			// Get notes
			let notes = await Notes.findOne({ user: user._id });
			if (notes == null) return null;

			// Add new note
			notes.notes.push({ title: title, content: content });
			await notes.save();

			// Get added note (always last index)
			return notes.notes[notes.notes.length - 1];
		},
		deleteNote: async (_, args) => {
			let { authKey, id } = args;
			if (authKey == null || authKey.trim() == '') return;

			// Find user
			let user = await User.findOne({ auth_key: authKey });
			if (user == null) return null;
			if (isExpired(user.auth_expiry)) return null;

			// Get notes
			let notes = await Notes.findOne({ user: user._id });
			if (notes == null) return null;

			// Remove note with specific ID
			notes.notes.pull({ _id: id });
			await notes.save();

			// Return deletion ID
			return id;
		},
		editNote: async (_, args) => {
			let { authKey, id, title, content } = args;
			if (authKey == null || authKey.trim() == '') return;

			// Find user
			let user = await User.findOne({ auth_key: authKey });
			if (user == null) return null;
			if (isExpired(user.auth_expiry)) return null;

			// Get notes
			let notes = await Notes.findOne({ user: user._id });
			if (notes == null) return null;

			// Get note with specific ID
			let note = notes.notes.id(id);
			if (note == null) return;

			// Edit data
			note.set({
				title: title,
				content: content,
			});
			await notes.save();

			return note;
		},
	},
};

module.exports = {
	typeDefs,
	resolvers,
};
