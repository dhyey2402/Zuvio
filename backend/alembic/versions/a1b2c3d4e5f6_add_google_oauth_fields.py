"""Add Google OAuth fields

Revision ID: a1b2c3d4e5f6
Revises: 0175d065bb8e
Create Date: 2026-09-06 17:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0175d065bb8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add auth_provider with default value
    op.add_column('users', sa.Column('auth_provider', sa.String(), server_default='local', nullable=False))
    
    # Add google_id
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    
    # Alter password_hash to be nullable
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(),
               nullable=True)


def downgrade() -> None:
    # Revert password_hash to NOT NULL
    # This might fail if there are records with NULL password_hash, but for downgrade it's expected
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(),
               nullable=False)
    
    # Drop google_id and its index
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')
    
    # Drop auth_provider
    op.drop_column('users', 'auth_provider')
