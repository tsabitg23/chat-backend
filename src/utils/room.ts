import { IAllUsers } from "../types";

export const leaveRoom = (userID:string, chatRoomUsers:IAllUsers) => {
    return chatRoomUsers.filter((user) => user.id != userID);
}