import { AppDataSource } from "../db/datasource";
import { User } from "../entity/User.entity";
import { IUser } from "../models/user.interface";

export async function findUser(id: number): Promise<User | null> {
  return await AppDataSource.manager.findOne(User, {
    where: {
      id,
    },
  });
}

export async function createUser(user: IUser): Promise<User> {
  const newUser = new User();
  newUser.id = user.id;
  newUser.first_name = user.first_name;
  newUser.last_name = user.last_name;
  newUser.username = user.username;
  return await AppDataSource.manager.save(newUser);
}
