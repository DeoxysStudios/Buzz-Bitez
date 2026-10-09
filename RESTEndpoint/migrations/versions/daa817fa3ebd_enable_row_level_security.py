"""enable row level security

Revision ID: daa817fa3ebd
Revises: 1a846a0790d0
Create Date: 2026-10-09 14:03:28.898485

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'daa817fa3ebd'
down_revision: Union[str, Sequence[str], None] = '1a846a0790d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ["users", "events", "event_times", "event_tags", "likes", "alembic_version"]


def upgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
