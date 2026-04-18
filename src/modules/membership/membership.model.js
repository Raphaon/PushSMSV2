export class membership {
    constructor() {
        this.membership = [];
        this.user_id = null;
        this.user_role = null;
    }

        addMembership(req, res) {

        const { user_id, user_role } = req.body;    
        if (!user_id || !user_role) {
            const error = new ErrorHandler();
            error.setError('User ID and role are required', 400);
            return res.status(400).json(error.getError());
        }

        const newMembership = {
            id: randomUUID(),
            user_id,
            user_role
        };

        this.membership.push(newMembership);
        return res.status(201).json(newMembership);
    }

    getAllMemberships(req, res) {
        return res.status(200).json(this.membership);
    }

    getMembershipById(req, res) {
        const { id } = req.params;
        const membership = this.membership.find(m => m.id === id);
        if (!membership) {
            const error = new ErrorHandler();
            error.setError('Membership not found', 404);
            return res.status(404).json(error.getError());
        }
        return res.status(200).json(membership);
    }

    deleteMembership(req, res) {
        const { id } = req.params;
        const index = this.membership.findIndex(m => m.id === id);
        if (index === -1) {
            const error = new ErrorHandler();
            error.setError('Membership not found', 404);
            return res.status(404).json(error.getError());
        }
        this.membership.splice(index, 1);
        return res.status(204).send();
    }

    updateMembership(req, res) {  
        const { id } = req.params;
        const { user_id, user_role } = req.body;
        const membership = this.membership.find(m => m.id === id);
        if (!membership) {
            const error = new ErrorHandler();
            error.setError('Membership not found', 404);
            return res.status(404).json(error.getError());
        }
        Object.assign(membership, { user_id, user_role });
        return res.status(200).json(membership);
    }   
}