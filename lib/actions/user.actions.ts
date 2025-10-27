"use server"

import {connectToDatabase} from '@/database/mongoose';
import { ObjectId } from "mongodb";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const getUserById = async (userId: string) => {
    try {
        const mongooseInstance = await connectToDatabase();
        const db = mongooseInstance.connection.db;
        if (!db) throw new Error('Mongoose connection not connected');

        return await db.collection('user').findOne({ _id: new ObjectId(userId) });

    } catch (e) {
        console.error('Error fetching user for news email:', e);
        return null;
    }
}