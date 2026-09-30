<?php

return [
    'blockchain_mode' => env('BLOCKCHAIN_MODE', 'mock'),
    'solana_rpc_url' => env('SOLANA_RPC_URL', 'https://api.devnet.solana.com'),
    'solana_program_id' => env('SOLANA_PROGRAM_ID'),
    'mock_usdc_mint' => env('MOCK_USDC_MINT'),
];
