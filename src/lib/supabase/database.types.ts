
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "daily_checkins": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"notes": string | null,"updated_at": string,"user_id": string,"water_ml": number | null,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"id"?: string,"notes"?: string | null,"updated_at"?: string,"user_id"?: string,"water_ml"?: number | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"notes"?: string | null,"updated_at"?: string,"user_id"?: string,"water_ml"?: number | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"daily_meal_items": {
                  Row: {
                    "calories": number,"carbs_g": number | null,"created_at": string,"fat_g": number | null,"fiber_g": number | null,"food_id": string | null,"id": string,"incomplete_nutrients": (string)[],"meal_id": string,"name_snapshot": string,"position": number,"protein_g": number | null,"quantity": number,"recipe_id": string | null,"saturated_fat_g": number | null,"sodium_mg": number | null,"unit": Database["public"]['Enums']["quantity_unit"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "calories": number,"carbs_g"?: number | null,"created_at"?: string,"fat_g"?: number | null,"fiber_g"?: number | null,"food_id"?: string | null,"id"?: string,"incomplete_nutrients"?: (string)[],"meal_id": string,"name_snapshot": string,"position"?: number,"protein_g"?: number | null,"quantity": number,"recipe_id"?: string | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"unit": Database["public"]['Enums']["quantity_unit"],"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "calories"?: number,"carbs_g"?: number | null,"created_at"?: string,"fat_g"?: number | null,"fiber_g"?: number | null,"food_id"?: string | null,"id"?: string,"incomplete_nutrients"?: (string)[],"meal_id"?: string,"name_snapshot"?: string,"position"?: number,"protein_g"?: number | null,"quantity"?: number,"recipe_id"?: string | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"unit"?: Database["public"]['Enums']["quantity_unit"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_meal_items_food_id_user_id_fkey"
      columns: ["food_id","user_id"]
isOneToOne: false
      referencedRelation: "foods"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "daily_meal_items_meal_id_user_id_fkey"
      columns: ["meal_id","user_id"]
isOneToOne: false
      referencedRelation: "daily_meals"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "daily_meal_items_recipe_id_user_id_fkey"
      columns: ["recipe_id","user_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"daily_meals": {
                  Row: {
                    "created_at": string,"custom_name": string | null,"date": string,"id": string,"meal_type": Database["public"]['Enums']["meal_type"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"custom_name"?: string | null,"date": string,"id"?: string,"meal_type": Database["public"]['Enums']["meal_type"],"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"custom_name"?: string | null,"date"?: string,"id"?: string,"meal_type"?: Database["public"]['Enums']["meal_type"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"exercise_sets": {
                  Row: {
                    "created_at": string,"id": string,"is_warmup": boolean,"load_kg": number | null,"notes": string | null,"reps": number,"set_number": number,"user_id": string,"workout_exercise_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_warmup"?: boolean,"load_kg"?: number | null,"notes"?: string | null,"reps": number,"set_number": number,"user_id"?: string,"workout_exercise_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_warmup"?: boolean,"load_kg"?: number | null,"notes"?: string | null,"reps"?: number,"set_number"?: number,"user_id"?: string,"workout_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_sets_workout_exercise_id_user_id_fkey"
      columns: ["workout_exercise_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_exercises"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"equipment": string | null,"id": string,"muscle_group": Database["public"]['Enums']["muscle_group"],"name": string,"notes": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"equipment"?: string | null,"id"?: string,"muscle_group": Database["public"]['Enums']["muscle_group"],"name": string,"notes"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"equipment"?: string | null,"id"?: string,"muscle_group"?: Database["public"]['Enums']["muscle_group"],"name"?: string,"notes"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"foods": {
                  Row: {
                    "archived_at": string | null,"base_quantity": number,"base_unit": Database["public"]['Enums']["quantity_unit"],"calories": number,"carbs_g": number | null,"created_at": string,"fat_g": number | null,"fiber_g": number | null,"id": string,"name": string,"notes": string | null,"protein_g": number | null,"saturated_fat_g": number | null,"sodium_mg": number | null,"unit_weight": number | null,"unit_weight_unit": Database["public"]['Enums']["quantity_unit"] | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"base_quantity": number,"base_unit": Database["public"]['Enums']["quantity_unit"],"calories": number,"carbs_g"?: number | null,"created_at"?: string,"fat_g"?: number | null,"fiber_g"?: number | null,"id"?: string,"name": string,"notes"?: string | null,"protein_g"?: number | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"unit_weight"?: number | null,"unit_weight_unit"?: Database["public"]['Enums']["quantity_unit"] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"base_quantity"?: number,"base_unit"?: Database["public"]['Enums']["quantity_unit"],"calories"?: number,"carbs_g"?: number | null,"created_at"?: string,"fat_g"?: number | null,"fiber_g"?: number | null,"id"?: string,"name"?: string,"notes"?: string | null,"protein_g"?: number | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"unit_weight"?: number | null,"unit_weight_unit"?: Database["public"]['Enums']["quantity_unit"] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"recipe_items": {
                  Row: {
                    "created_at": string,"food_id": string,"id": string,"position": number,"quantity": number,"recipe_id": string,"unit": Database["public"]['Enums']["quantity_unit"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"food_id": string,"id"?: string,"position"?: number,"quantity": number,"recipe_id": string,"unit": Database["public"]['Enums']["quantity_unit"],"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"food_id"?: string,"id"?: string,"position"?: number,"quantity"?: number,"recipe_id"?: string,"unit"?: Database["public"]['Enums']["quantity_unit"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_items_food_id_user_id_fkey"
      columns: ["food_id","user_id"]
isOneToOne: false
      referencedRelation: "foods"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "recipe_items_recipe_id_user_id_fkey"
      columns: ["recipe_id","user_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"recipes": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string,"notes": string | null,"servings": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"servings"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"servings"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workout_exercises": {
                  Row: {
                    "created_at": string,"exercise_id": string,"id": string,"notes": string | null,"position": number,"user_id": string,"workout_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"id"?: string,"notes"?: string | null,"position": number,"user_id"?: string,"workout_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"id"?: string,"notes"?: string | null,"position"?: number,"user_id"?: string,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercises_exercise_id_user_id_fkey"
      columns: ["exercise_id","user_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "workout_exercises_workout_id_user_id_fkey"
      columns: ["workout_id","user_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workouts": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"notes": string | null,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"id"?: string,"notes"?: string | null,"title": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"notes"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "food_accepts_unit":
{ Args: { "p_base_unit": Database["public"]['Enums']["quantity_unit"],"p_unit": Database["public"]['Enums']["quantity_unit"],"p_unit_weight_unit": Database["public"]['Enums']["quantity_unit"] }; Returns: boolean
                           },
"is_valid_timezone":
{ Args: { "tz": string }; Returns: boolean
                           },
"save_meal":
{ Args: { "p_custom_name": string,"p_date": string,"p_id": string,"p_items": Json,"p_meal_type": Database["public"]['Enums']["meal_type"] }; Returns: string
                           },
"save_recipe":
{ Args: { "p_id": string,"p_items": Json,"p_name": string,"p_notes": string,"p_servings": number }; Returns: string
                           },
"save_workout":
{ Args: { "p_date": string,"p_exercises": Json,"p_id": string,"p_notes": string,"p_title": string }; Returns: string
                           }
          }
          Enums: {
            "meal_type": "cafe_da_manha"|"almoco"|"lanche"|"jantar"|"personalizada","muscle_group": "peito"|"costas"|"ombros"|"biceps"|"triceps"|"antebracos"|"abdomen"|"quadriceps"|"posteriores"|"gluteos"|"panturrilhas"|"adutores"|"abdutores"|"corpo_inteiro","quantity_unit": "g"|"ml"|"unidade"|"porcao"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "meal_type": ["cafe_da_manha", "almoco", "lanche", "jantar", "personalizada"],"muscle_group": ["peito", "costas", "ombros", "biceps", "triceps", "antebracos", "abdomen", "quadriceps", "posteriores", "gluteos", "panturrilhas", "adutores", "abdutores", "corpo_inteiro"],"quantity_unit": ["g", "ml", "unidade", "porcao"]
          }
        }
} as const
