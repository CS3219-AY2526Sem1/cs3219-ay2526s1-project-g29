const mongoose = require('mongoose');
const Question = require('../models/question-model');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const MONGO_URI = process.env.QUESTION_DB_CLOUD_URI || 'mongodb://127.0.0.1:27017/peerprepQuestionServiceDB';

const sampleQuestions = [
    {
        title: "Reverse a String",
        description: `Write a function that reverses a string. The input string is given as an array of characters <code>s</code>.<br><br>

You must do this by modifying the input array in-place with <code>O(1)</code> extra memory.<br><br><br>


<strong>Example 1:</strong>
<pre><strong>Input:</strong> s = ["h","e","l","l","o"]
<strong>Output:</strong> ["o","l","l","e","h"]</pre>
<strong>Example 2:</strong>
<pre><strong>Input:</strong> s = ["H","a","n","n","a","h"]
<strong>Output:</strong> ["h","a","n","n","a","H"]</pre><br><br>


<strong>Constraints:</strong><br>
- <code>1 <= s.length <= 10<sup>5</sup></code><br>
- <code>s[i]</code> is a printable ascii character.`,
        difficulty: "easy",
        topics: ["strings", "algorithms"],
    },
    {
        title: "Linked List Cycle Detection",
        description: "Implement a function to detect if a linked list contains a cycle.",
        difficulty: "easy",
        topics: ["data-structures", "algorithms", "linked-lists"],
    },
    {
        title: "Roman to Integer",
        description: "Given a roman numeral, convert it to an integer.",
        difficulty: "easy",
        topics: ["algorithms"],
    },
    {
        title: "Add Binary",
        description: "Given two binary strings <code>a</code> and <code>b</code>, return their sum as a binary string.",
        difficulty: "easy",
        topics: ["bit-manipulation", "algorithms", "strings"],
    },
    {
        title: "Fibonacci Number",
        description: `The Fibonacci numbers, commonly denoted <code>F(n)</code> form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. <br><br>

That is:<br>
<code>F(0) = 0, F(1) = 1</code><br>
<code>F(n) = F(n - 1) + F(n - 2)</code>, for <code>n > 1</code>.<br><br><br>

Given <code>n</code>, calculate <code>F(n)</code>.`,
        difficulty: "easy",
        topics: ["recursion", "algorithms", "dynamic-programming"],
    },
    {
        title: "Implement Stack using Queues",
        description: `Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).`,
        difficulty: "easy",
        topics: ["data-structures", "stacks", "queues"],
    },
    {
        title: "Combine Two Tables",
        description: `Given table <code>Person</code> with the following columns:<br>
<pre>1. <code>personId (int)</code>
2. <code>lastName (varchar)</code>
3. <code>firstName (varchar)</code></pre>

<code>personId</code> is the primary key.
And table <code>Address</code> with the following columns:<br>
<pre>1. <code>addressId (int)</code>
2. <code>personId (int)</code>
3. <code>city (varchar)</code>
4. <code>state (varchar)</code></pre>
<code>addressId</code> is the primary key.<br><br>
Write a solution to report the first name, last name, city, and state of each person in the <code>Person</code> table. If the address of a <code>personId</code> is not present in the <code>Address</code> table, report <code>null</code> instead.<br><br>
Return the result table in any order.`,
        difficulty: "easy",
        topics: ["databases"],
    },
    {
        title: "Repeated DNA Sequences",
        description: `The DNA sequence is composed of a series of nucleotides abbreviated as <code>'A'</code>, <code>'C'</code>, <code>'G'</code>, and <code>'T'</code>.<br><br>

For example, <code>"ACGAATTCCG"</code> is a DNA sequence.<br><br>

When studying DNA, it is useful to identify repeated sequences within the DNA.<br><br><br>

Given a string <code>s</code> that represents a DNA sequence, return all the 10-letter-long sequences (substrings) that occur more than once in a DNA molecule. You may return the answer in any order.`,
        difficulty: "medium",
        topics: ["algorithms", "bit-manipulation", "hash-tables", "strings"],
    },
    {
        title: "Course Schedule",
        description: `There are a total of <code>numCourses</code> courses you have to take, labeled from <code>0</code> to <code>numCourses - 1</code>. <br><br>

You are given an array <code>prerequisites</code> where <code>prerequisites[i] = [ai, bi]</code> indicates that you must take course <code>bi</code> first if you want to take course <code>ai</code>. <br><br>

For example, the pair <code>[0, 1]</code>, indicates that to take course 0 you have to first take course 1. Return <code>true</code> if you can finish all courses. Otherwise, return <code>false</code>.
`,
        difficulty: "medium",
        topics: ["data-structures", "algorithms"],
    },
    {
        title: "LRU Cache Design",
        description: "Design and implement an LRU (Least Recently Used) cache.",
        difficulty: "medium",
        topics: ["data-structures", "hash-tables"],
    },
    {
        title: "Longest Common Subsequence",
        description: `Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.

A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

For example, "ace" is a subsequence of "abcde".

A common subsequence of two strings is a subsequence that is common to both strings.`,
        difficulty: "medium",
        topics: ["strings", "algorithms", "dynamic-programming"],
    },
    {
        title: "Rotate Image",
        description: `You are given an <code>n x n</code> 2D matrix representing an image.<br><br>

Rotate the image by 90 degrees (clockwise).`,
        difficulty: "medium",
        topics: ["arrays", "algorithms", "matrix"],
    },
    {
        title: "Airplane Seat Assignment Probability",
        description: `<code>n</code> passengers board an airplane with exactly <code>n</code> seats. The first passenger has lost the ticket and picks a seat randomly. But after that, the rest of the passengers will: <br>

        <pre>Take their own seat if it is still available, and Pick other seats randomly when they find their seat occupied.</pre><br>

        Return the probability that the <code>n</code>th person gets his own seat.`,
        difficulty: "medium",
        topics: ["math"],
    },
    {
        title: "Validate Binary Search Tree",
        description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
        difficulty: "medium",
        topics: ["data-structures", "algorithms", "trees"],
    },
    {
        title: "Sliding Window Maximum",
        description: `You are given an array of integers <code>nums</code>, there is a sliding window of size <code>k</code> which is moving from the very left of the array to the very right. You can only see the <code>k</code> numbers in the window. Each time the sliding window moves right by one position.<br><br>

Return the max sliding window.`,
        difficulty: "hard",
        topics: ["arrays", "algorithms"],
    },
    {
        title: "N-Queen Problem",
        description: `The n-queens puzzle is the problem of placing <code>n</code> queens on an <code>n x n</code> chessboard such that no two queens attack each other. <br><br>
        
        Given an integer <code>n</code>, return all distinct solutions to the n- queens puzzle. You may return the answer in any order. <br><br>
        
        Each solution contains a distinct board configuration of the n-queens' placement, where 'Q' and '.' both indicate a queen and an empty space, respectively.
        `,
        difficulty: "hard",
        topics: ["algorithms"],
    },
    {
        title: "Serialize and Deserialize a Binary Tree",
        description: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.<br><br>

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.`,
        difficulty: "hard",
        topics: ["data-structures", "algorithms", "trees"],
    },
    {
        title: "Wildcard Matching",
        description: `Given an input string <code>s</code> and a pattern <code>p</code>, implement wildcard pattern matching with support for <code>'?'</code> and <code>'*'</code> where:<br><br>

<code>'?'</code> matches any single character.<br>
<code>'*'</code> matches any sequence of characters (including the empty sequence).<br><br><br>

The matching should cover the entire input string (not partial).`,
        difficulty: "hard",
        topics: ["strings", "algorithms", "dynamic-programming"],
    },
    {
        title: "Chalkboard XOR Game",
        description: `You are given an array of integers <code>nums</code> representing the numbers written on a chalkboard.<br><br>

Alice and Bob take turns erasing exactly one number from the chalkboard, with Alice starting first. If erasing a number causes the bitwise XOR of all the elements of the chalkboard to become <code>0</code>, then that player loses. The bitwise XOR of one element is that element itself, and the bitwise XOR of no elements is <code>0</code>.<br><br>

Also, if any player starts their turn with the bitwise XOR of all the elements of the chalkboard equal to <code>0</code>, then that player wins.<br><br><br>

Return <code>true</code> if and only if Alice wins the game, assuming both players play optimally.`,
        difficulty: "hard",
        topics: ["bit-manipulation"],
    },
    {
        title: "Trips and Users",
        description: `
        Given table <code>Trips</code>:
<pre>1. <code>id</code> (int)
2. <code>client_id</code> (int)
3. <code>driver_id</code> (int)
4. <code>city_id</code> (int)
5. <code>status</code>
(enum)
6. <code>request_at</code> (date)</pre>

<code>id</code> is the primary key. <br><br>

The table holds all taxi trips. Each trip has a unique <code>id</code>, while <code>client_id</code> and <code>driver_id</code> are foreign keys to the <code>users_id</code> at the <code>Users</code> table.
<code>status</code> is an <code>ENUM</code> (category) type of <code>('completed', 'cancelled_by_driver', 'cancelled_by_client')</code>. <br><br>

And table <code>Users</code>:
<pre>1. <code>users_id</code> (int)
2. <code>banned</code> (enum)
3. <code>role</code> (enum)</pre>

<code>users_id</code> is the primary key (column with unique values) for this table. <br><br>

The table holds all users. Each user has a unique <code>users_id</code>, and <code>role</code> is an <code>ENUM</code> type of <code>('client', 'driver', 'partner')</code>. <br>
<code>banned</code> is an <code>ENUM</code> (category) type of <code>('Yes', 'No')</code>. The cancellation rate is computed by dividing the number of canceled (by client or driver) requests with unbanned users by the total number of requests with unbanned users on that day. <br><br>

Write a solution to find the cancellation rate of requests with unbanned users (both client and driver must not be banned) each day between <code>"2013-10-01"</code> and <code>"2013-10-03"</code>. Round Cancellation Rate to two decimal points. <br><br>

Return the result table in any order.`,
        difficulty: "hard",
        topics: ["databases"],
    },
];

async function seedQuestions() {
    try {
        console.log(`Connecting to: ${MONGO_URI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'}`);

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');
        console.log(`Database: ${mongoose.connection.name}`);

        const inserted = await Question.insertMany(sampleQuestions);

        console.log(`Successfully seeded ${inserted.length} questions!`);

        const summary = await Question.aggregate([
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('\n📊 Question Summary:');
        summary.forEach(s => {
            console.log(`   ${s._id}: ${s.count} questions`);
        });

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

seedQuestions();