import axios from "axios";
import dotenv from "dotenv";
import { generateUsername } from "unique-username-generator";

dotenv.config();
const BASE_URL = process.env.BASE_URL;
const PASSWORD = process.env.PASSWORD;

const getDomain = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/domains`);
        return response.data['hydra:member'][0]['domain'];
    } catch (error) {
        throw new Error("Failed to fetch domain");
    }
}

const generateEmail = async (req, res) => {
    try {
        const domain = await getDomain();
        const username = generateUsername("", 3);
        const emailAddress = `${username}@${domain}`;

        const accountResponse = await axios.post(`${BASE_URL}/accounts`, {
            address: emailAddress,
            password: PASSWORD,
        });

        const { id, address } = accountResponse.data;

        const tokenResponse = await axios.post(`${BASE_URL}/token`, {
            address: address,
            password: PASSWORD,
        });

        const token = tokenResponse.data;

        res.json({
            status: "success",
            message: "Email Generated",
            email: address,
            data: token,
            createdAt: new Date().toISOString(),
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || "An error occurred",
        });
    }
}

const fetchInbox = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] // Extract token from Authorization header
            || req.cookies.authToken // If using cookies
            || req.session.authToken; // If using sessions

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No Auth Token Provided."
            });
        }

        const response = await axios.get(`${BASE_URL}/messages`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch inbox"
        });
    }
}

const getMessageById = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
            || req.cookies.authToken
            || req.session.authToken;

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No Auth Token Provided."
            });
        }

        const { id } = req.params;
        const response = await axios.get(`${BASE_URL}/messages/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch message"
        });
    }
}

const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1]
            || req.cookies.authToken
            || req.session.authToken;

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No Auth Token Provided."
            });
        }

        await axios.patch(`${BASE_URL}/messages/${id}`, { seen: true }, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/merge-patch+json"
            }
        });
        res.status(200).json({ seen: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteMessage = async (req, res) => {

    const { id } = req.params;

    try {
        const response = await axios.delete(`${BASE_URL}/messages/${id}`, {
            headers: {
                "Authorization": req.headers.authorization
            }
        })
        res.status(204).json({
            status: "success",
            message: "Message deleted successfully",
            id: id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

const viewAttachments = async (req, res) => {

    const { id, attachmentId } = req.params;

    try {
        const response = await axios.get(`${BASE_URL}/messages/${id}/attachment/${attachmentId}`, {
            headers: {
                "Authorization": req.headers.authorization
            },
            responseType: 'arraybuffer'
        });

        const buffer = response.data;
        const type = response.headers['content-type'];
        const filename = response.headers['content-disposition'].split('filename=')[1].trim();

        res.status(200);
        res.setHeader('Content-Type', type);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

export { generateEmail, fetchInbox, getMessageById, markMessageAsRead, deleteMessage, viewAttachments };