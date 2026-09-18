from getpass import getpass

from backend.database import Base, engine, SessionLocal
from backend.models import User
from backend.auth import hash_password


Base.metadata.create_all(bind=engine)

db = SessionLocal()

print()
print("================================")
print("       MyArchive Setup")
print("================================")
print()

username = input("Choose username: ").strip()
password = getpass("Choose password: ")
confirm = getpass("Confirm password: ")

if not username:
    print("Username cannot be empty.")
    db.close()
    exit()

if password != confirm:
    print("Passwords do not match.")
    db.close()
    exit()

existing_user = db.query(User).filter(
    User.username == username
).first()

if existing_user:
    print("That username already exists.")
    db.close()
    exit()

user = User(
    username=username,
    password_hash=hash_password(password)
)

db.add(user)
db.commit()

print()
print("================================")
print("Account created successfully!")
print("You can now start MyArchive.")
print("================================")
print()

db.close()