<?php

namespace App\Http\Controllers\Api;

use App\Models\Milestone;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends ApiController
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(['student', 'employer', 'mentor'])],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create($data);
            if ($user->role === 'student') {
                StudentProfile::create(['user_id' => $user->id]);
            }

            return $user;
        });

        return $this->success([
            'user' => $this->userPayload($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 'Đăng ký thành công.', 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return $this->error('Email hoặc mật khẩu không đúng.', 422, [
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        return $this->success([
            'user' => $this->userPayload($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 'Đăng nhập thành công.');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->success(null, 'Đăng xuất thành công.');
    }

    public function me(Request $request)
    {
        return $this->success($this->userPayload($request->user()), 'Lấy hồ sơ thành công.');
    }

    private function userPayload(User $user): User
    {
        $user->load('studentProfile');

        if ($user->role === 'student') {
            $earnedBalance = Milestone::query()
                ->where('status', 'paid')
                ->whereHas('job.applications', fn ($query) => $query
                    ->where('student_id', $user->id)
                    ->where('status', 'accepted'))
                ->sum('amount');

            $user->setAttribute('earned_balance', (float) $earnedBalance);
            $user->setAttribute('sbt_count', count($user->studentProfile?->sbt_data ?? []));
        }

        return $user;
    }
}
