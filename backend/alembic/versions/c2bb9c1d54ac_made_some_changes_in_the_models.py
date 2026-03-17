"""made some changes in the models

Revision ID: c2bb9c1d54ac
Revises: 05c62d04cd83
Create Date: 2026-03-14 17:03:16.318212
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c2bb9c1d54ac'
down_revision: Union[str, Sequence[str], None] = '05c62d04cd83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # order_items
    op.add_column('order_items', sa.Column('price_at_time', sa.Float(), nullable=True))

    # orders
    op.add_column('orders', sa.Column('order_date', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('total_amount', sa.Float(), nullable=True))
    op.add_column('orders', sa.Column('payment_method', sa.String(), nullable=True))

    # Create ENUM type first
    order_status_enum = sa.Enum(
        'pending_payment',
        'payment_verified',
        'processing',
        'completed',
        'cancelled',
        name='orderstatus'
    )
    order_status_enum.create(op.get_bind())

    # Convert status column to ENUM
    op.execute("""
        ALTER TABLE orders
        ALTER COLUMN status
        TYPE orderstatus
        USING status::orderstatus
    """)

    op.drop_index(op.f('ix_orders_id'), table_name='orders')
    op.drop_column('orders', 'created_at')

    # payments
    op.add_column('payments', sa.Column('voucher_notes', sa.Text(), nullable=True))
    op.add_column('payments', sa.Column('amount', sa.Float(), nullable=False))
    op.add_column('payments', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('payments', sa.Column('verified_at', sa.DateTime(), nullable=True))
    op.add_column('payments', sa.Column('verified_by', sa.Integer(), nullable=True))
    op.add_column('payments', sa.Column('rejection_reason', sa.Text(), nullable=True))

    op.alter_column(
        'payments',
        'payment_method',
        existing_type=sa.VARCHAR(),
        nullable=False
    )

    op.create_unique_constraint(None, 'payments', ['order_id'])
    op.create_foreign_key(None, 'payments', 'users', ['verified_by'], ['id'])

    # products
    op.add_column('products', sa.Column('name', sa.String(), nullable=True))
    op.add_column('products', sa.Column('reserved_stock', sa.Integer(), nullable=True))
    op.add_column('products', sa.Column('description', sa.String(), nullable=True))

    op.alter_column(
        'products',
        'price',
        existing_type=sa.INTEGER(),
        type_=sa.Float(),
        existing_nullable=True
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        'products',
        'price',
        existing_type=sa.Float(),
        type_=sa.INTEGER(),
        existing_nullable=True
    )

    op.drop_column('products', 'description')
    op.drop_column('products', 'reserved_stock')
    op.drop_column('products', 'name')

    op.drop_constraint(None, 'payments', type_='foreignkey')
    op.drop_constraint(None, 'payments', type_='unique')

    op.alter_column(
        'payments',
        'payment_method',
        existing_type=sa.VARCHAR(),
        nullable=True
    )

    op.drop_column('payments', 'rejection_reason')
    op.drop_column('payments', 'verified_by')
    op.drop_column('payments', 'verified_at')
    op.drop_column('payments', 'created_at')
    op.drop_column('payments', 'amount')
    op.drop_column('payments', 'voucher_notes')

    op.add_column(
        'orders',
        sa.Column(
            'created_at',
            postgresql.TIMESTAMP(),
            autoincrement=False,
            nullable=True
        )
    )

    op.create_index(op.f('ix_orders_id'), 'orders', ['id'], unique=False)

    op.alter_column(
        'orders',
        'status',
        existing_type=sa.Enum(
            'pending_payment',
            'payment_verified',
            'processing',
            'completed',
            'cancelled',
            name='orderstatus'
        ),
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.drop_column('orders', 'payment_method')
    op.drop_column('orders', 'total_amount')
    op.drop_column('orders', 'order_date')

    op.drop_column('order_items', 'price_at_time')

    # Drop enum type
    sa.Enum(
        'pending_payment',
        'payment_verified',
        'processing',
        'completed',
        'cancelled',
        name='orderstatus'
    ).drop(op.get_bind())