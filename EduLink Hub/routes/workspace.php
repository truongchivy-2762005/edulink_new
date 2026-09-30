<?php

use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:employer,mentor,admin'])->prefix('workspace')->group(function () {
    Route::get('/config', [WorkspaceController::class, 'config']);
    Route::get('/disputes', [WorkspaceController::class, 'disputes']);
    Route::get('/disputes/{dispute}', [WorkspaceController::class, 'dispute']);
    Route::get('/submissions/{submission}/file', [WorkspaceController::class, 'file']);
    Route::middleware('role:employer,admin')->group(function () {
        Route::get('/jobs', [WorkspaceController::class, 'jobs']);
        Route::get('/jobs/{job}', [WorkspaceController::class, 'job']);
        Route::get('/escrows', [WorkspaceController::class, 'escrows']);
    });
    Route::middleware('role:employer')->group(function () {
        Route::get('/company', [WorkspaceController::class, 'company']);
        Route::put('/company', [WorkspaceController::class, 'saveCompany']);
    });
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [WorkspaceController::class, 'users']);
        Route::patch('/users/{user}', [WorkspaceController::class, 'updateUser']);
    });
});
