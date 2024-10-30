import 'reflect-metadata'
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
class User {
  // eslint-disable-next-line prettier/prettier
  @PrimaryGeneratedColumn()
  id!: number

  // eslint-disable-next-line prettier/prettier
  @Column('text')
  name!: string

  @Column('text')
  email!: string

  @Column('text')
  password!: string
}

export default User
